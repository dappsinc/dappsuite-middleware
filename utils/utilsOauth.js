"use strict";

let cacheService = require('../services/cacheService');
let daoServiceModule = require('../services/daoservice.js');
let request = require("request");
let daoService = new daoServiceModule();
let url = require('url');

let processOrgAndUserAuthentication = function(user, oauth){

    return new Promise(function (resolve, reject) {
        
        //check if org exists else create
        daoService.createOrUpdateOrg({
            id : user.organization_id,        
            instanceUrl : oauth.instance_url,
            environment : oauth.environment,
            name : user.first_name + " " + user.last_name,
            information : user.user_id,
            isActive: true
        })
        .then(function(orgResult){
            //id: tokenResult.id
            return Promise.all([
                processUser(user, oauth),
                processOauth(user, oauth)                
            ])
            .then(function(value){
                console.log("####value", value);
                resolve(value)
            })                      
        })
        .catch(function (error) {
            console.log("###error", error);
            reject(error);
        });

    });
}

let processUser = function(user,oauth){

    return new Promise(function (resolve, reject) {

        let userObjMap = sfUserObjToDappsObjMap(user, oauth);

        daoService.findOrCreateUser({
                    where: {
                        id: user.user_id,
                        orgId: user.organization_id                    
                    },
                    defaults: userObjMap
        })
        .spread( function (userResult, created) {                                                      
            //update user if already exisits
            if(!created){                        
                let options = { where: { srno: userResult.srno }};

                userObjMap.srno = userResult.srno;
                daoService.updateUser(
                    userObjMap,options
                )
                .then(function(value){
                    resolve("User Updated");
                });
            }else{
                resolve("User Created")
            }
        })        
        .catch(function (error) {
            reject(error);
        });
    });

}

let processOauth = function(user,oauth){

    return new Promise(function (resolve, reject) {

        let userObjMap = sfUserObjToDappsObjMap(user, oauth);
        //console.log("#######outh", oauth, JSON.stringify(oauth));

        daoService.findOrCreateTokenStore({
                    where: {
                        userId: user.user_id,
                        orgId: user.organization_id                    
                    },
                    defaults: { oauth: JSON.stringify(oauth), accessToken: oauth.access_token, refreshToken: oauth.refresh_token}
        })
        .spread( function (tokenResult, created) {                                                      
            //update TokenStore if already exisits
            if(!created){                                    
                let tokenObj = { oauth: JSON.stringify(oauth), accessToken: oauth.access_token, refreshToken: oauth.refresh_token };
                let options = { where: { id: tokenResult.id }};
                daoService.updateTokenStore(
                    tokenObj,options
                )
                .then(function(value){                    
                    resolve("oauth updated");
                });
            }else{
                resolve("oauth created")
            }
        })
        .catch(function (error) {
            reject(error);
        });
    });
}

let updateTokenStoreBasedOnAccessToken = function(newOauth,oldOauth){

    return new Promise(function (resolve, reject) {

        let orgAndUser = getOrgIdAndUserIdFromOauth(newOauth.id);            
        if(orgAndUser){
            cacheService.setCache("oauth", orgAndUser[0]+orgAndUser[1], newOauth);
        }

        let tokenObj = { oauth: JSON.stringify(newOauth), accessToken: newOauth.access_token, refreshToken: newOauth.refresh_token };            
        let options = { where: { accessToken: oldOauth.access_token }};

        daoService.updateTokenStore(
            tokenObj, options
        )
        .then(function(value){                    
            resolve("processAuthBasedOnAccessToken auth updated");
        })        
        .catch(function (error) {
            reject(error);
        });
        
    });
}

let getOauth = function(sfReqObj){
    return new Promise(function (resolve, reject) {
    
        let reply = {};
        let tempOauth = cacheService.getCache("oauth", sfReqObj.orgId+sfReqObj.userId);
        console.log('***tempOauth***',tempOauth);
        if(tempOauth){
            reply = {
                loggedIn: true,
                oauth: tempOauth
            }
            resolve(reply);
        }else{
        
            //look in tokenstore
            daoService.findOneTokenStore({
                    where: {
                        orgId: sfReqObj.orgId,
                        userId: sfReqObj.userId                          
                    }
            })
            .then(function (value) {
                console.log('***value***',value);
                if (value === null) {
                    let salesforceEndpoint = require('../endpoints/salesforce');
                    reply = {
                        loggedIn: false,
                        error: "Not Connected to Dapps Network. Please connect to Dapps using the Url.",
                        loginUrl: salesforceEndpoint.getLoginUri(sfReqObj.environment)                        
                    };
                    console.log('***value***',reply);
                    resolve(reply);
                } else {
                    //console.log("#####value", value);
                    let oauth = JSON.parse(value.oauth);
                    cacheService.setCache("oauth", sfReqObj.orgId+sfReqObj.userId, oauth);
                    reply = {
                            loggedIn: true,
                            oauth: oauth
                        };
                    console.log('***reply***',reply);
                    resolve(reply);
                    
                }
            })
            .catch(function (error) {
                console.error('***error***',error);
                reject(error);
            });
        }
    });
}


let sfUserObjToDappsObjMap = function(user,auth){

    return  {
                firstName : user.first_name,
                lastName : user.last_name,
                id : user.user_id,
                orgId : user.organization_id,
                username : user.username,
                nickName : user.nick_name,
                displayName : user.display_name,
                email : user.email,
                addressStreet : user.addr_street,
                addressCity : user.addr_city,
                addressState : user.addr_state,
                addressCountry : user.addr_country,
                addressZip : user.addr_zip,
                mobile : user.mobile_phone,
                userType : user.user_type,
                utcOffset : user.utcOffset,
                comments : "{'instanceUrl': "+auth.instance_url+ ", 'language': "+ user.language +"}",
                instanceUrl : auth.instance_url, 
                isActive: true
            };

}


let getOrgIdAndUserIdFromOauth = function(idUrl){
    let tempUrl =url.parse(idUrl);

    if(tempUrl && tempUrl.path){
        //orgId and UserId array
        return tempUrl.path.split("/").slice(2,4)
    }
    return undefined;

}


let getUserDetailsFromIdUrl = function (url, accessToken) {    

    let options = {
        method: 'GET',
        url: url,
        headers: {            
            'cache-control': 'no-cache',
            authorization: 'Bearer ' + accessToken
        }
    };

    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });   
}


let regenerateAccessToken = function (environment, client_id, client_secret, refresh_token) {
    
    let tempUrl = "https://login.salesforce.com/services/oauth2/token";

    if(environment == "sandbox"){
        tempUrl = "https://test.salesforce.com/services/oauth2/token";
    }

    let options = {
        method: 'POST',
        url: tempUrl,
        qs: {
            grant_type: 'refresh_token',
            client_id: client_id,
            client_secret: client_secret,
            refresh_token: refresh_token
        }
    };

    return new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
};


let removeTokenFromDatabase = function (userId,orgId) {
    return new Promise(function (resolve, reject) {
        
            daoService.destroyTokenStore({
                where: {
                    userId: userId,
                    orgId: orgId
                }
            })
            .then(function (value) {
                resolve(value);
            })
            .catch(function (error) {
                reject(error);
            });
    });
};

exports.processOrgAndUserAuthentication = processOrgAndUserAuthentication;
exports.updateTokenStoreBasedOnAccessToken = updateTokenStoreBasedOnAccessToken;
exports.getOrgIdAndUserIdFromOauth = getOrgIdAndUserIdFromOauth;
exports.getUserDetailsFromIdUrl = getUserDetailsFromIdUrl;
exports.getOauth = getOauth;
