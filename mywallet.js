var ethUtil = require('ethereumjs-util');
ethUtil.crypto = require('crypto');
ethUtil.Tx = require('ethereumjs-tx');
ethUtil.scrypt = require('scryptsy');
ethUtil.uuid = require('uuid');


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
   if (jsonArr.encseed != null) return Wallet.fromEthSale(strjson, password);
   else if (jsonArr.Crypto != null || jsonArr.crypto != null) return Wallet.fromV3(strjson, password, true);
   else if (jsonArr.hash != null) return Wallet.fromMyEtherWallet(strjson, password);
   else if (jsonArr.publisher == "MyEtherWallet") return Wallet.fromMyEtherWalletV2(strjson);
   else throw globalFuncs.errorMsgs[2];
};

var scopeWallet = Wallet.getWalletFromPrivKeyFile('{"address":"2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab","crypto":{"cipher":"aes-128-ctr","ciphertext":"58e5e189bdd0206efb10726aadd784d8c466ed6f6723bfd96f3b78262f3d44bc","cipherparams":{"iv":"d0e5441d8649466bae602feea8ce2eda"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"839af0b337cf2eeae6311a544d7ebed02e44ee1e821d77c733fdc497dae873b8"},"mac":"fc660260202cc76af6248e880ff3b99d8dc3b393cda32dac0a58764abbd0ce01"},"id":"cdbfdb6a-539d-4b2a-93b6-4ab3955edf1d","version":3}',"qwertyuiop");

console.log('ScopeWallet:',scopeWallet);























