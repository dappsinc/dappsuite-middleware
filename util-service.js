var ethUtil = require('ethereumjs-util');
ethUtil.crypto = require('crypto');
ethUtil.Tx = require('ethereumjs-tx');
ethUtil.scrypt = require('scryptsy');
ethUtil.uuid = require('uuid');
let logger = require('./utils/utilsLogger.js');
let daoServiceModule = require('./services/daoservice.js');
let daoService = new daoServiceModule();

var Wallet = function Wallet(priv, pub, path, hwType, hwTransport) {
    if (typeof priv != "undefined") {
        this.privKey = priv.length == 32 ? priv : Buffer(priv, 'hex');
    }
    this.pubKey = pub;
    this.path = path;
    this.hwType = hwType;
    this.hwTransport = hwTransport;
    this.type = "default";
};


Wallet.prototype.getAddress = function () {
    if (typeof this.pubKey == "undefined") {
        return ethUtil.privateToAddress(this.privKey);
    } else {
        return ethUtil.publicToAddress(this.pubKey, true);
    }
};

Wallet.prototype.getAddressString = function () {
    return '0x' + this.getAddress().toString('hex');
};


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Wallet.fromEthSale = function (input, password) {
    var json = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' ? input : JSON.parse(input);
    var encseed = new Buffer(json.encseed, 'hex');
    var derivedKey = ethUtil.crypto.pbkdf2Sync(Buffer(password), Buffer(password), 2000, 32, 'sha256').slice(0, 16);
    var decipher = ethUtil.crypto.createDecipheriv('aes-128-cbc', derivedKey, encseed.slice(0, 16));
    var seed = Wallet.decipherBuffer(decipher, encseed.slice(16));
    var wallet = new Wallet(ethUtil.sha3(seed));
    if (wallet.getAddress().toString('hex') !== json.ethaddr) {
        throw new Error('Decoded key mismatch - possibly wrong passphrase');
    }
    return wallet;
};
Wallet.decipherBuffer = function (decipher, data) {
    return Buffer.concat([decipher.update(data), decipher.final()]);
};

Wallet.fromV3 = function (input, password, nonStrict) {
    var json = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' ? input : JSON.parse(nonStrict ? input.toLowerCase() : input);
    if (json.version !== 3) {
        throw new Error('Not a V3 wallet');
    }
    var derivedKey;
    var kdfparams;
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams;
        derivedKey = ethUtil.scrypt(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else if (json.crypto.kdf === 'pbkdf2') {
        kdfparams = json.crypto.kdfparams;
        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2');
        }
        derivedKey = ethUtil.crypto.pbkdf2Sync(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else {
        throw new Error('Unsupported key derivation scheme');
    }
    var ciphertext = new Buffer(json.crypto.ciphertext, 'hex');
    var mac = ethUtil.sha3(Buffer.concat([derivedKey.slice(16, 32), ciphertext]));
    if (mac.toString('hex') !== json.crypto.mac) {
        throw new Error('Key derivation failed - possibly wrong passphrase');
    }
    var decipher = ethUtil.crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), new Buffer(json.crypto.cipherparams.iv, 'hex'));
    var seed = Wallet.decipherBuffer(decipher, ciphertext, 'hex');
    while (seed.length < 32) {
        var nullBuff = new Buffer([0x00]);
        seed = Buffer.concat([nullBuff, seed]);
    }
    return new Wallet(seed);
};

Wallet.fromMyEtherWallet = function (input, password) {
    var json = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' ? input : JSON.parse(input);
    var privKey;
    if (!json.locked) {
        if (json.private.length !== 64) {
            throw new Error('Invalid private key length');
        }
        privKey = new Buffer(json.private, 'hex');
    } else {
        if (typeof password !== 'string') {
            throw new Error('Password required');
        }
        if (password.length < 7) {
            throw new Error('Password must be at least 7 characters');
        }
        var cipher = json.encrypted ? json.private.slice(0, 128) : json.private;
        cipher = Wallet.decodeCryptojsSalt(cipher);
        var evp = Wallet.evp_kdf(new Buffer(password), cipher.salt, {
            keysize: 32,
            ivsize: 16
        });
        var decipher = ethUtil.crypto.createDecipheriv('aes-256-cbc', evp.key, evp.iv);
        privKey = Wallet.decipherBuffer(decipher, new Buffer(cipher.ciphertext));
        privKey = new Buffer(privKey.toString(), 'hex');
    }
    var wallet = new Wallet(privKey);
    if (wallet.getAddressString() !== json.address) {
        throw new Error('Invalid private key or address');
    }
    return wallet;
};

Wallet.fromMyEtherWalletV2 = function (input) {
    var json = (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' ? input : JSON.parse(input);
    if (json.privKey.length !== 64) {
        throw new Error('Invalid private key length');
    };
    var privKey = new Buffer(json.privKey, 'hex');
    return new Wallet(privKey);
};

Wallet.getWalletFromPrivKeyFile = function (strjson, password) {
    var jsonArr = JSON.parse(strjson);
    console.log('getWalletFromPrivKeyFile**strjson:',strjson);
    console.log('getWalletFromPrivKeyFile**jsonArr:',jsonArr);
    console.log('getWalletFromPrivKeyFile**crypto:',jsonArr.crypto);
    console.log('getWalletFromPrivKeyFile**Crypto:',jsonArr["address"]);
   if (jsonArr.encseed != null) return Wallet.fromEthSale(strjson, password);
   else if (jsonArr.Crypto != null || jsonArr.crypto != null) return Wallet.fromV3(strjson, password, true);
   else if (jsonArr.hash != null) return Wallet.fromMyEtherWallet(strjson, password);
   else if (jsonArr.publisher == "MyEtherWallet") return Wallet.fromMyEtherWalletV2(strjson);
   else throw globalFuncs.errorMsgs[2];
};
Wallet.getPrivateKeyString = function (buff) {
    if (typeof buff != "undefined") {
        return buff.toString('hex');
    } else {
        return "";
    }
};

Wallet.prototype.toV3 = function (password,_derivedKey, opts) {
    opts = opts || {};
    var salt = opts.salt || ethUtil.crypto.randomBytes(32);
    var iv = opts.iv || ethUtil.crypto.randomBytes(16);
    var derivedKey = Buffer.from(_derivedKey, 'utf8');;
    var kdf = opts.kdf || 'scrypt';
    var kdfparams = {
        dklen: opts.dklen || 32,
        salt: salt.toString('hex')
    };
    if (kdf === 'pbkdf2') {
        kdfparams.c = opts.c || 262144;
        kdfparams.prf = 'hmac-sha256';
        derivedKey = ethUtil.crypto.pbkdf2Sync(new Buffer(password), salt, kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
        // FIXME: support progress reporting callback
        kdfparams.n = opts.n || 262144;
        kdfparams.r = opts.r || 8;
        kdfparams.p = opts.p || 1;
        if(!derivedKey){
            derivedKey = ethUtil.scrypt(new Buffer(password), salt, kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
        }
    } else {
        throw new Error('Unsupported kdf');
    }
    var cipher = ethUtil.crypto.createCipheriv(opts.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
        throw new Error('Unsupported cipher');
    }
    var ciphertext = Buffer.concat([cipher.update(this.privKey), cipher.final()]);
    var mac = ethUtil.sha3(Buffer.concat([derivedKey.slice(16, 32), new Buffer(ciphertext, 'hex')]));
    return {
        version: 3,
        id: ethUtil.uuid.v4({
            random: opts.uuid || ethUtil.crypto.randomBytes(16)
        }),
        address: this.getAddress().toString('hex'),
        Crypto: {
            ciphertext: ciphertext.toString('hex'),
            cipherparams: {
                iv: iv.toString('hex')
            },
            cipher: opts.cipher || 'aes-128-ctr',
            kdf: kdf,
            kdfparams: kdfparams,
            mac: mac.toString('hex')
        }
    };
};

var getWalletFromPrivKeyFile = function(accountJSONStr, password){
    var strKey ;
    try{
        var scopeWallet = Wallet.getWalletFromPrivKeyFile(accountJSONStr, password);
    
         var bufferKey =  scopeWallet.privKey;
         strKey =  Wallet.getPrivateKeyString(bufferKey);
    }catch(e){
        console.log('error in getWalletFromPrivKeyFile:',e);
        strKey = undefined;
    }
    
    //var strKey = bufferKey.toString('ascii');
    console.log('strKey:',strKey);
    return strKey;
}

var getWalletFromPrivKey = function(_privateKey){
    let devConsole = logger.getLogger('***UtilService***getWalletFromPrivKey***');
    var strKey ;
    let accountJsonObj;
    try{
        var scopeWallet = Wallet.fromMyEtherWalletV2({privKey : _privateKey});
        //devConsole.debug('***scopeWallet***',scopeWallet);        
        //devConsole.debug('***JSON***',scopeWallet.toV3(undefined,_privateKey,undefined));
         accountJsonObj = scopeWallet.toV3(undefined,_privateKey,undefined);        
    }catch(e){
        devConsole.error('***e***',e);
        accountJsonObj = undefined;
    }
    
    //var strKey = bufferKey.toString('ascii');
    
    return accountJsonObj;
}

// var getAccountJSONFile  = function(accountId){
//     var accountJSONMap = {};
//     accountJSONMap['0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab'] = '{"address":"2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab","crypto":{"cipher":"aes-128-ctr","ciphertext":"58e5e189bdd0206efb10726aadd784d8c466ed6f6723bfd96f3b78262f3d44bc","cipherparams":{"iv":"d0e5441d8649466bae602feea8ce2eda"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"839af0b337cf2eeae6311a544d7ebed02e44ee1e821d77c733fdc497dae873b8"},"mac":"fc660260202cc76af6248e880ff3b99d8dc3b393cda32dac0a58764abbd0ce01"},"id":"cdbfdb6a-539d-4b2a-93b6-4ab3955edf1d","version":3}';
//     accountJSONMap['0x6bE945386ffC51296795ff3cbdc3580c9D9607Da'] = '{"address":"6be945386ffc51296795ff3cbdc3580c9d9607da","crypto":{"cipher":"aes-128-ctr","ciphertext":"26df6717f3851b7bd57af4868eb11b46bff000e0f1f3fdba2332e94f66686359","cipherparams":{"iv":"10d46e82d22e345a46a77adde5d44182"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"254c564dea8b2c97cfde4087a6fe2d4284da595f3a8cc186607320034fb2dbba"},"mac":"c6496dbdd16501d16581dc86bd95d4cf03a06900871a5ac05e89abee6b68e9d1"},"id":"b5282f95-11d3-4445-98e2-115c73d32888","version":3}';
//     return accountJSONMap[accountId];
// }
var getAccountJSONFile  = function(accountId){
    let getKeyPromise = daoService.findKeyByAddress(accountId);
    return getKeyPromise;
}


var getPrivateKey = function(params){

    return new Promise(function(resolve,reject){
        var signUsingOption = params.signUsingOption;
        var isRegistered = params.isRegistered;
        var accountId = params.accountId;
        var ethereumPassword = params.ethereumPassword;
        var accountJsonInput = params.accountJson;
        var privateKey;

        console.log('getPrivateKey:params:',params);
        if(signUsingOption == 'P'){
            privateKey =  params.privateKey;
            resolve(privateKey);
        }
        else if(signUsingOption == 'E'){
            if(isRegistered){
                //Having JSON file in Dapps System
                var accountPromise = getAccountJSONFile(accountId);
                console.log('getPrivateKey:accountPromise:',accountPromise);
                accountPromise.then(function(keyObject){
                    console.log('getPrivateKey:keyObject:',keyObject);
                    let accountJSONStr = keyObject.addressDetailsJson;
                    if(accountJSONStr){
                        privateKey =  getWalletFromPrivKeyFile(accountJSONStr,ethereumPassword);
                        resolve(privateKey);
                    }
                    else{
                       reject({statusCode : 'KEY_NOT_FOUND_FOR_PRIVATE_KEY', statusMessage : 'For Ethereum Password Option, Key entry is not found for address : '+accountId}); 
                    }
                });
            }
            else{
                if(!accountJsonInput){
                    reject({statusCode : 'NO_JSON_PROVIDED_FOR_PRIVATE_KEY', statusMessage : 'For Ethereum Password Option, No Account JSON is provided'});
                }
                privateKey =  getWalletFromPrivKeyFile(accountJsonInput,ethereumPassword);
                resolve(privateKey);
            }
        }
    }).catch(function(err){
        console.error('***Error in util-service.js - getPrivateKey*** errr : ',err);
    });
}

var importAccountInDb = function(orgId,userId,keyObjectStr){
    let devConsole = logger.getLogger('***UtilService***importAccountInDb***');
    let accountJSONObj = JSON.parse(keyObjectStr);
    let accountAddress =  accountJSONObj.address;
    let keyObj = {
        orgId : orgId,
        address : accountAddress,
        addressType : 'ETH',
        userId : userId,
        isActive : true,
        addressDetailsJson : keyObjectStr,
        deployedOnVM : false,
        information : accountAddress
    };
    devConsole.debug('***keyObj***',keyObj);

    daoService.createOrUpdateKey(keyObj)
     .then(function(isCreated){
         devConsole.debug('***isCreated***',isCreated);
     });
}

var importAccount = function(accountDetail){
    let devConsole = logger.getLogger('***UtilService***importAccountInDb***');
    let importOption = accountDetail.importOption;
    let accountName =  accountDetail.accountName;
    if(!accountName){
        accountName = 'New Account';
    }
    let privateKey = accountDetail.privateKey;
    let accountJsonStr = accountDetail.accountJsonStr;
    let orgId = accountDetail.orgId;
    let userId = accountDetail.userId;
    let accountJsonObj;
    devConsole.debug('***accountDetail***',accountDetail);

    let response = {};
    if(importOption == 'F'){
        //Import using JSON File
        accountJsonObj = JSON.parse(accountJsonStr);
        //importAccountInDb(orgId,userId, accountJsonStr);
    }else if(importOption == 'K'){
        accountJsonObj=getWalletFromPrivKey(privateKey);
        
        devConsole.debug('***accountJsonStr in PrivateKey Option***',accountDetail);
    }
    else{
        return {message : 'Invalid import option selected.'};
    }
    let _address = accountJsonObj.address;
    if(_address && !_address.startsWith('0x')){
        accountJsonObj.address = '0x' + _address;
    }

    return new Promise(function(resolve,reject){
        let accountGetPromise = daoService.findKeyByAddress(accountJsonObj.address);
        accountGetPromise.then(function(accountObj){
            devConsole.debug('***existing accountObj***',accountObj);
            if(accountObj && accountObj.address){
                reject({message : 'Account already exist with address :' + accountObj.address });
            }else{
                accountJsonStr = JSON.stringify(accountJsonObj);
                importAccountInDb(orgId,userId, accountJsonStr);

                //response.accountJsonStr = accountJsonStr;
                response.accountName = accountName;
                if(accountJsonObj)
                    response.address = accountJsonObj.address;
                resolve(response);
            }
        });
    });
}

var exportAccount = function(_data){
    let devConsole = logger.getLogger('***UtilService***exportAccount***');
    devConsole.debug('***_data***',_data);
    let address = _data.address;
    let password = _data.password;

    let exportPromise = getAccountJSONFile(address);
    return exportPromise;
    // exportPromise.then(function(accountJsonObj){
    //      return new Promise(function(resolve,reject){
    //         resolve(accountJsonObj);
    //      });
    // });
}

var exportPrivateKey = function(_data){
    let devConsole = logger.getLogger('***UtilService***exportAccount***');
    let address = _data.address;
    let password = _data.password;
    devConsole.debug('***_data***',_data);
    return new Promise(function(resolve,reject){
        let exportPromise = getAccountJSONFile(address);
        exportPromise.then(function(accountJsonObj){
            if(accountJsonObj){
                console.log('***accountJsonObj***',accountJsonObj);
                let privateKey =  getWalletFromPrivKeyFile(accountJsonObj.addressDetailsJson,password);
                if(privateKey){
                    console.log('***privateKey***',privateKey);
                    resolve(privateKey);
                }else{
                    reject({message : 'Not able to retrieve private key from provided details due to wrong password.'});
                }
                
            }else{
                reject({message : 'Account with address:' + address + ' is not found.'});
            }
            
        });
        
     });

}
//var scopeWallet = Wallet.getWalletFromPrivKeyFile('{"address":"2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab","crypto":{"cipher":"aes-128-ctr","ciphertext":"58e5e189bdd0206efb10726aadd784d8c466ed6f6723bfd96f3b78262f3d44bc","cipherparams":{"iv":"d0e5441d8649466bae602feea8ce2eda"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"839af0b337cf2eeae6311a544d7ebed02e44ee1e821d77c733fdc497dae873b8"},"mac":"fc660260202cc76af6248e880ff3b99d8dc3b393cda32dac0a58764abbd0ce01"},"id":"cdbfdb6a-539d-4b2a-93b6-4ab3955edf1d","version":3}',"qwertyuiop");

exports.getWalletFromPrivKeyFile = getWalletFromPrivKeyFile;
exports.getPrivateKey=getPrivateKey;
exports.getAccountJSONFile = getAccountJSONFile;
exports.importAccount = importAccount;
exports.exportAccount = exportAccount;
exports.exportPrivateKey = exportPrivateKey;



















