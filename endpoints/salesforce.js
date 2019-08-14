"use strict";

let nforce = require('nforce');
let request = require("request");
let https = require('https');
let app = require('../index');
let config = require("../config/config");
let url = require("url");
let utilsOauth = require("../utils/utilsOauth");
let daoServiceModule = require('../services/daoservice');
let cacheService = require('../services/cacheService');
let randomstring = require("randomstring");
let daoService = new daoServiceModule();

let orgProduction = nforce.createConnection(config.SF_ORG_PRODUCTION);
let orgSandbox = nforce.createConnection(config.SF_ORG_SANDBOX);



//function to get nforce object
let getNforce =  function (environment) {
    if( environment == "sandbox"){
        return orgSandbox;
    }      
    return orgProduction;        
}

//for every salesforce operation, pass on object 
//let sfReqObj =  {orgId: "00D7F000001Yvo8UAC", userId: "0057F000001QtGQQA0", environment: "production"}

//general fucntion query records from SF. Pass on the query and callback function
//sf.getRecordsByQuery(sfReqObj, "select id from account limit 4"}

let getRecordsByQuery = function (sfReqObj, query){
    return new Promise(function (resolve, reject) {

        processRequest(sfReqObj)
        .then(function(result){
            
            if (result && result.response.loggedIn){                

                let org = result.org;

                org.query({ query: query,oauth: result.response.oauth })
                .then(function(response){
                    resolve(response);
                })
                .catch(function(error){
                    reject(error);
                })

            } else {
                resolve(result);
            }
        })
        .catch(function (error) {
            reject(error);
        });	
    });
}


//sobjectType:account, fieldList: [{name: "name", value: "first account using multi user"}]
let insertSObject = function (sfReqObj, sobjectType, fieldList) {

    return new Promise(function (resolve, reject) {

        processRequest(sfReqObj)
        .then(function(result){

            if (result && result.response.loggedIn){

                let org = result.org;
                
                let sobject = createSObjectAndMapFields(sobjectType, fieldList);
                console.log("#####sobject", sobject);

                org.insert({ sobject: sobject,oauth: result.response.oauth })
                .then(function(response){
                    resolve(response);
                })
                .catch(function(error){
                    reject(error);
                });


            } else {
                reject(result);
            }
        })
        .catch(function (error) {
            reject(error);
        });	
    })
}


//sobjectType:account, fieldList: [{name: "name", value: "first account using multi user"}]
let updateSObject = function (sfReqObj, sobjectType, fieldList) {

    return new Promise(function (resolve, reject) {

        processRequest(sfReqObj)
        .then(function(result){
            console.log("**salesforce.js**updateSObject**result:", result);
            if (result && result.response.loggedIn){

                let org = result.org;
                let sobject = createSObjectAndMapFields(sobjectType, fieldList);
                console.log("#####sobject", sobject);

                org.update({ sobject: sobject,oauth: result.response.oauth })
                .then(function(response){
                    resolve(response);
                })
                .catch(function(error){
                    console.log("#####sobject error", error);
                    reject(error);
                });

            } else {
                resolve(result);
            }
        })
        .catch(function (error) {
            reject(error);
        });	
    }).catch(function(error){
        console.log('***error in salesforce.js ->updateSObject : ***',error);
    });
}


let updateWithReference = function(sfReqObj, sObjectType, referenceName, referenceValue, fieldList, additionalDetails){

    let otherFieldsName = '';
    
	if(additionalDetails){
		otherFieldsName = ','+additionalDetails.referenceName;
    }
    
	let query = 'SELECT ID, Name '+otherFieldsName+' FROM '+sObjectType+' WHERE '+referenceName+'=\''+referenceValue + '\'';
    
    getRecordsByQuery(sfReqObj, query)
    .then(function(result){
        console.log('*****updateWithReference***records:',result.records);
        console.log('*****updateWithReference***records[0]:',result.records[0]);
        if(result.records){
            let fields = result.records[0]["_fields"];
            console.log('*****updateWithReference***fields:',fields);
            let sObjectId = fields.id;
            console.log('*****updateWithReference***sObjectId:',sObjectId);
            var updatePromise = updateWithId(sfReqObj, sObjectId, sObjectType ,fieldList);
            updatePromise.then(function(response){
                console.log('*****Salesforce.Js**updateWithReference***updatePromise->response:',response);
            }).catch(function(error){
                console.log('*****Salesforce.Js**updateWithReference***updatePromise->error:',error);
            });

            if(additionalDetails){
                var otherSObjectType = additionalDetails.sObjectType;
                var otherFields = additionalDetails.fields;
                var otherReferenceName = additionalDetails.referenceName;

                var updatePromise2 = updateWithId(sfReqObj, fields[otherReferenceName], otherSObjectType ,otherFields);
                updatePromise2.then(function(response){
                    console.log('*****Salesforce.Js**updateWithReference***updatePromise2->response:',response);
                }).catch(function(error){
                    console.log('*****Salesforce.Js**updateWithReference***updatePromise2->error:',error);
                });
            }
        }
    })
    .catch(function (error) {
        reject(error);
    });		
}


let updateWithId = function(sfReqObj, recordId, sObjectType, fieldList) {
    console.log('*****Salesforce.Js**updateWithId**sfReqObj:',sfReqObj);
    console.log('*****Salesforce.Js**updateWithId**recordId:',recordId);
    console.log('*****Salesforce.Js**updateWithId**sObjectType:',sObjectType);
    console.log('*****Salesforce.Js**updateWithId**fieldList:',fieldList);
    fieldList.push({ name : 'id', value : recordId });
    return updateSObject(sfReqObj, sObjectType, fieldList);
}


//auth and command functions
//this will authenticate and return org
let processRequest = function(sfReqObj, type){

    return new Promise(function (resolve, reject) {

        utilsOauth.getOauth(sfReqObj)
        .then(function(result){

            if (result && result.loggedIn){

                let org = getNforce(sfReqObj.environment);     
                console.log("in process req resolve");           
                resolve({org: org, response: result});

            } else {
                console.log("in process req resolve 1");           
                resolve(result);
            }
        })
        .catch(function (error) {
            reject(error);
        });	
    });

}


let createSObjectAndMapFields = function(sobjectType, fieldList){

    let sobject = nforce.createSObject(sobjectType);    

    for(let i=0;i<fieldList.length;i++){
        let field = fieldList[i];
        sobject.set(field.name, field.value);
    }

    return sobject;

}


//connected app callback //connected app and oauth related code
//https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9szVa2RxsqBZZXJ9NY21err14BtzYZm_7rKbWrErzRKmb7kAYk__9Ky44sdtlcxfHRlFAaHW6Ig8BkSH6&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Foauth%2Fcallback&scope=refresh_token%20id%20api%20chatter_api&state=%7B%22environment%22%3A%22production%22%7D
let respondToSFDCCallback = function(req, res) {    
    console.log("#####req.query.state ", req.query.state);
    let environmentTmp = JSON.parse(req.query.state).environment;
    let oauthsession = JSON.parse(req.query.state).oauthsession;
    let environment = (parseInt(environmentTmp)%2==0) ? 'production':'sandbox';
    if(cacheService.getCache("oauthsession", oauthsession)){    

        let org = getNforce(environment);

        org.authenticate({code: req.query.code}, function (err, resp) {
            if (!err) {
                
                let oauth = resp;            
                console.log("####oauth", oauth);
                
                utilsOauth.getUserDetailsFromIdUrl(oauth.id,oauth.access_token)
                .then(function (userDetails) {
                    //check if org exists, if not, create org, user and token store records
                    //if org exists and user doen't then create user and token store
                    //else. get the user with org id and update the token store
                    oauth.environment = environment;
                    let userDetailsObj = JSON.parse(userDetails);
                    cacheService.setCache("oauth", userDetailsObj.organization_id+userDetailsObj.user_id, oauth);
                    utilsOauth.processOrgAndUserAuthentication(userDetailsObj, oauth)
                    .then(function (processResult){
                        console.log("#####processOrgAndUserAuthentication", processResult);
                    });
                    
                }).catch(function (error) {
                    console.log(error);
                });

                cacheService.clearCache("oauthsession", oauthsession);
        
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write("<html><head>" +                        
                    "</head><body><p>You are now connected to Dapps network." +
                    "</p><p>You may now close this window and start using Dapps.</p>" +
                    "</body></html>");
                res.end();           

            } else {
                res.send("ERROR: " + err);
                return console.log("Error: " + err.message);
            }
        });

    }else{
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write("<html><head>" +
            "</head><body><p>Invalid state. Please try again." +
            "</body></html>");
        res.end();           
    }
};
//end of connected app code


let getLoginUri = function (environment) {       
  
    let org = getNforce(environment);
    let tempSession = randomstring.generate();

    cacheService.setCache("oauthsession", tempSession, tempSession);
    let timeInt = new Date().getTime();
    if(environment=='production'){
        if(timeInt%2!=0){
            timeInt = timeInt + 1;
        }
    }
    else{
        if(timeInt%2==0){
            timeInt = timeInt + 1;
        }
    }
    let timeStr = ''+timeInt;
            
    return org.getAuthUri(
        {
            state: JSON.stringify({
                //"environment": environment || "production",
                "environment" : timeStr,
                "oauthsession": tempSession
            }),
            scope: ["refresh_token", "id", "api", "chatter_api"]
        }
    );
};

//exports.login = login;
exports.getLoginUri = getLoginUri;
exports.respondToSFDCCallback = respondToSFDCCallback;
exports.getRecordsByQuery = getRecordsByQuery;
exports.insertSObject = insertSObject;
exports.updateSObject = updateSObject;
exports.updateWithId = updateWithId;
exports.updateWithReference = updateWithReference;
exports.processRequest = processRequest;
