let globalCache = {};
let oauthCache = {};


let getCache = function(cacheType, cacheId){
    if(globalCache[cacheType]){
        return globalCache[cacheType][cacheId];
    }
    return undefined
    console.log("####getCache ", globalCache);
    
}

let clearCache = function(cacheType, cacheId){
    if(globalCache[cacheType]){
        delete globalCache[cacheType][cacheId];
    }
    console.log("####clearCache ", globalCache);
    return undefined
    
}

let setCache = function(cacheType, cacheId, cacheValue){
    //console.log("#####globalCache first", globalCache, cacheType, cacheId, cacheValue);
    if(globalCache[cacheType]){
        globalCache[cacheType][cacheId] = cacheValue;
    }else{
        globalCache[cacheType] = {};
        globalCache[cacheType][cacheId] = cacheValue;
    }
    console.log("####setCache ", globalCache);
    
}

let getOauthCache = function(orgId, userId){
    return oauthCache[orgId+userId];
}
let setOauthCache = function(orgId, userId, oauth){
    oauthCache[orgId+userId] = oauth;
}


exports.oauthCache = oauthCache;
exports.getOauthCache = getOauthCache;
exports.setOauthCache = setOauthCache;
exports.getCache = getCache;
exports.setCache = setCache;
exports.clearCache = clearCache;