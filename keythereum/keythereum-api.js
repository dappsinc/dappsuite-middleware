let logger = require('../utils/utilsLogger.js');
let keythereum = require("keythereum");
let daoServiceModule = require('../services/daoservice.js');
let daoService = new daoServiceModule();


var params = { keyBytes: 32, ivBytes: 16 };
let devConsole = logger.getLogger('***Keythereum-api.js***');


function createEthereumAccount(ethereumPassword, orgId, userId,exportToFile){
	var ds = keythereum.create(params);
    let privateKey = ds.privateKey;
    let iv = ds.iv;
    let salt = ds.salt;

    var options = {
	  kdf: "pbkdf2",
	  cipher: "aes-128-ctr",
	  kdfparams: {
	    c: 262144,
	    dslen: 32,
	    prf: "hmac-sha256"
	  }
	};

	var keyObject = keythereum.dump(ethereumPassword, privateKey, salt, iv, options);
	if(keyObject && keyObject.address && !keyObject.address.startsWith('0x')){
		keyObject.address = '0x'+ keyObject.address;
	}
	devConsole.debug('***keyObject***',keyObject);

	let keyObjectStr = JSON.stringify(keyObject);
	devConsole.debug('***keyObjectStr***',keyObjectStr);
	let keyObj = {
	    orgId : orgId,
	    address : keyObject.address,
	    addressType : 'ETH',
	    userId : userId,
	    isActive : true,
	    addressDetailsJson : keyObjectStr,
	    deployedOnVM : false,
	    information : keyObject.address
	};
	devConsole.debug('***keyObj***',keyObj);

	daoService.createOrUpdateKey(keyObj)
	 .then(function(isCreated){
	     devConsole.debug('***isCreated***',isCreated);
	 });


	if(exportToFile){
		keythereum.exportToFile(keyObject,'./keythereum/keystore', function(param){
			devConsole.debug('***param***',param);		
		});
	}
	return keyObject;

}

exports.createEthereumAccount = createEthereumAccount;
