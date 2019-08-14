const crypto = require('crypto');
let logger = require('./utils/utilsLogger.js');
const config = require('./crypto-config.json');

let daoServiceModule = require('./services/daoservice.js');
let daoService = new daoServiceModule();


function encryptString(plainText,secretKey) {
	var KEY = Buffer.from(secretKey, 'UTF-8'); //base64

	var passwordBuffer = new Buffer(plainText, 'UTF-8');
	var iv = crypto.randomBytes(16);

	var cipher = crypto.createDecipherivipheriv('aes-256-cbc', KEY, iv);
	var encryptedBuffer = cipher.update(passwordBuffer);
	var cipherFinal = Buffer.from(cipher.final('base64'),'base64');
	var encryptedText = Buffer.concat([iv, encryptedBuffer, cipherFinal]).toString('base64');

	return encryptedText;
}

function decryptString(encryptedText,secretKey) {
	console.log('***decryptString***encryptedText:',encryptedText);
	console.log('***decryptString***secretKey:',secretKey);
	var password = null;
	var orgId = null;
	var KEY = Buffer.from(secretKey, 'UTF-8');
	var encryptedPasswordBlob = new Buffer(encryptedText, 'base64');

	var iv = encryptedPasswordBlob.slice(0, 16);

	var passwordBuffer = encryptedPasswordBlob.toString('base64', 16);

	var decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
	
	password = decipher.update(passwordBuffer,'base64','utf-8');
	password += decipher.final('utf-8'); 
	
	return password;
}


function parseServerRequest(reqStrEncrypted, privateKey) {
	let devconsole = logger.getLogger('***Encrypt.js***parseServerRequest***');
	devconsole.info('***Enter***');
	devconsole.debug('***reqStrEncrypted***',reqStrEncrypted);
	devconsole.debug('***privateKey***',privateKey);
	

	var reqStrDecrypted = decryptString(reqStrEncrypted,privateKey);
	devconsole.debug('***reqStrDecrypted***',reqStrDecrypted);

	var reqJson = JSON.parse(reqStrDecrypted);
	devconsole.debug('***reqJson***',reqJson);

	var innerJSON =  JSON.parse(reqJson.dataStr);
	
	devconsole.debug('***innerJSON***',innerJSON);
	devconsole.info('***Exit***');

	return innerJSON;
}

function parseServerRequest2(reqStrEncrypted, orgId, skip) {
	let devconsole = logger.getLogger('***Encrypt.js***parseServerRequest2***');

	devconsole.debug('***reqStrEncrypted***',reqStrEncrypted);
	devconsole.debug('***orgId***',orgId);

	//In Case to bypass Encryption
	if(skip){
		return new Promise(function (resolve, reject) {
			resolve(JSON.parse(reqStrEncrypted));
		});
	}

	var promise = new Promise(function (resolve, reject) {
		daoService.findByIdOrg(orgId)
			.then(function(orgObj){
		    	devconsole.debug('***orgObj.secretKey***',orgObj.secretKey);

		    	if(!orgObj || !orgObj.secretKey){
		    		//reject({statusCode:500, status : '****Invalid Req***'});
		    		reject({statusCode:500, message : 'Organization is not verified or problem while sending data securely.',secretKey : undefined});
		    	}
				const privateKey = orgObj.secretKey;

				var reqStrDecrypted;
				try{
					reqStrDecrypted = decryptString(reqStrEncrypted,privateKey);
				}catch(e){
					devconsole.error('***decryptString error***parseServerRequest2 ***',reqStrDecrypted);
					reject({statusCode:500, message : 'Organization is not verified or problem while sending data securely.',secretKey : privateKey});
					return;
				}
				devconsole.debug('***reqStrDecrypted***',reqStrDecrypted);

				var reqJson = JSON.parse(reqStrDecrypted);
				devconsole.debug('***reqJson***',reqJson);
				//reqJson.secretKey = privateKey;
				resolve(reqJson);
				devconsole.info('***Exit***');
		});
	});

	return promise;
}

function parseServerRequestWithMasterKey(reqStrEncrypted, orgId) {
	let devconsole = logger.getLogger('***Encrypt.js***parseServerRequestWithMasterKey***')
	devconsole.debug('***reqStrEncrypted***',reqStrEncrypted);
	devconsole.debug('***orgId***',orgId);

	const MASTER_KEY = ''; // Set in Vars or Protected Custom Metadata
	let privateKey = MASTER_KEY;

	var decryptionPromise = new Promise((resolve,reject)=>{
		var reqStrDecrypted;
		try{
			reqStrDecrypted = decryptString(reqStrEncrypted,MASTER_KEY);
		}catch(e){
			devconsole.error('***decryptString error***parseServerRequestWithMasterKey ***',e);
			reject({errorCode : 'REQUEST_DECRYPTION_ERROR', errorDesc : 'Unable to recognize secure request, Please contact system admin to verify organization security configuration'});
		}
		devconsole.debug('***reqStrDecrypted***',reqStrDecrypted);
		var reqJson;
		try{
			reqJson = JSON.parse(reqStrDecrypted);
		}catch(e){
			devconsole.error('***JSON.parse(reqStrDecrypted) error***parseServerRequestWithMasterKey ***',e);
			reject({statusCode:500, status : 'Invalid key.', message : ''});
		}
		resolve(reqJson);
		devconsole.debug('***reqJson***',reqJson);
	});
	return decryptionPromise;
}

var packageResponse  = function(response,privateKey, postResponseFn){
	let devconsole = logger.getLogger('***Encrypt.js***PackageResponse***');
	devconsole.info('***Enter***');
	devconsole.debug('***response***',response);
	devconsole.debug('***privateKey***',privateKey);
	devconsole.debug('***postResponseFn***',postResponseFn);

	let responseToBeSent;

	if(config.encryptResponse){
		let resStr = JSON.stringify(response);
		let resStrEncrypted = encryptString(resStr,privateKey);
		devconsole.debug('***resStrEncrypted***',resStrEncrypted);
		responseToBeSent = {};
		
		responseToBeSent.resStr = resStrEncrypted;
	}else{
		responseToBeSent = response;
	}
	responseToBeSent.isEncrypted = (config.encryptResponse? true : false);
	//responseToBeSent.statusCode = 200;
    //responseToBeSent.status = 'SUCCESS';
    devconsole.debug('***responseToBeSent1***',responseToBeSent);
	if(postResponseFn){
		postResponseFn(responseToBeSent);
	}

	devconsole.debug('***responseToBeSent***',responseToBeSent);
	devconsole.info('***Exit***');

	return responseToBeSent;
}

exports.encryptString = encryptString;
exports.decryptString = decryptString;
exports.parseServerRequest = parseServerRequest;
exports.parseServerRequest2 = parseServerRequest2;
exports.parseServerRequestWithMasterKey = parseServerRequestWithMasterKey;
exports.packageResponse = packageResponse;