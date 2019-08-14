// BASE SETUP
// =============================================================================

// call the packages we need

var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');

var web3ApiClass = require('./web3.api.js');
var web3Api = new web3ApiClass();
var salesforce = require('./salesforce');
//var filter = require('./filter');
var service = require('./service');
var utilService = require('./util-service.js');
let salesforceEndpoint = require('./endpoints/salesforce');
const encryptService = require('./encrypt.js');
let daoServiceModule = require('./services/daoservice.js');
let daoService = new daoServiceModule();
let logger = require('./utils/utilsLogger.js');
let keythereumApi = require('./keythereum/keythereum-api.js');
let helmet = require('helmet');
let http = require('http');

let OauthCache = {};
let deploymentTime = new Date();

//TODO: This is a temp fix. Need to move this to a config file
let ethAccountSyncUrl = "";


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//Changes for node security
app.use(helmet.noCache());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());
app.use(helmet.expectCt({ maxAge: 30 * 24 * 60 *60 })); // 30 Days
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));

app.use(helmet.hsts({
  // ...
  setIf: function (req, res) {
    if (req.secure) {
      return true
    } else {
      return false
    }
  }
}))

var sixtyDaysInSeconds = 5184000;
app.use(helmet.hsts({
setIf: function (req, res) {
    if (req.secure) {
      return true
    } else {
      return false
    }
  },
  maxAge: sixtyDaysInSeconds,
  includeSubDomains : false
}));


app.use(helmet.frameguard({ action: 'deny' }));//sameorigin
app.use(helmet());
app.disable('x-powered-by');

//Intercepter
// app.use(function(req, res, next) {
 
//   let devconsole = logger.getLogger('***Index.js***Intercepter***');
//     devconsole.debug('Inside Intercepter');
// 	let datajson = req.body;
// 	devconsole.debug('***datajson***',datajson);
// 	let reqStrEncrypted = datajson.reqStr;
// 	const orgId = datajson.orgId;

// 	var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
// 	reqPromise.then(
// 		function(parsedRequest){
// 			devconsole.debug('***parsedRequest***',parsedRequest);
// 		}
// 	).error(function(error){
// 		devconsole.debug('***error***',error);
// 	});

//   next();
// });


var allowCrossDomain = function(req,res,next){
	res.header('Access-Control-Allow-Origin','*');
	res.header('Access-Control-Allow-Methods','PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers','Content-Type, Authorization,Accept');
	next();
}

app.use(allowCrossDomain);


var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router



var getArguments = function(constructorParam){
	if(!constructorParam){
		return [];
	}
	var _count = constructorParam.count;
	var paramMap = constructorParam.args;
	var arguments = [];
	if(paramMap!=undefined){
		for(var i=0;i<_count;i++){
			arguments.push(parseParam(paramMap[i]));
		}
	}
	return arguments;
}

var parseParam =  function(param){
	console.log('@@@@param:',param);
	if(param!=undefined){
		var _val = param.value;
		if(_val==undefined){
			return undefined;
		}
		else if(param.type == 'uint' || param.type == 'uint256'){
			if(typeof _val == 'number'){
				return _val;
			}
			else if(typeof _val == 'string'){
				return parseInt(_val);
			}
		}
		else if(param.type == 'string'){
			if(typeof _val == 'number'){
				return ''+_val;
			}
			else if(typeof _val == 'string'){
				return _val;
			}
		}
		else if(param.type == 'address'){
				return ""+_val;
		}
		console.warn('param does not match with any type');
		return undefined;

	}
}

var getDefault = function(param){
	//
}

var syncGethNode = function(){
    request(ethAccountSyncUrl+"/api/syncAccToGethNode", function (error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:', body); // Print the HTML for the Google homepage.
	});
}

let prepareResponse = function(type,responseJson,params){
    if(!responseJson){
        responseJson = { message : 'Something went wrong.'};
    }
    let responseStr = JSON.stringify(responseJson);
    
    let encryptResponse;
    let secretKey;

    if(params){
        encryptResponse = params.encryptResponse;
        secretKey = params.secretKey;
    }
    
    let finalResponseJson = {};
    let finalResponseStr;

    if(encryptResponse){
        responseStr = encryptService.encryptString(responseStr,'<PRIVATE_KEY>'); //TODO
    }

    finalResponseJson.responseStr = responseStr;

    if(type == 'SUCCESS'){
        finalResponseJson.status = 'SUCCESS';
        finalResponseJson.statusCode = 200;
    }
    else if(type == 'ERROR'){
        finalResponseJson.status = 'ERROR';
        finalResponseJson.statusCode = 500;
    }
    console.log('finalResponseJson:',finalResponseJson);
    return  finalResponseJson;
}

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/test', function(req, res) {
    res.json({ message: 'Node Server is running normally, deployed on :(IST) 20/10/2017 22:48 PM --(GMT)'+deploymentTime});
});

router.get('/testweb3', function(req, res) {
    res.json({ message:  'Account :' + web3Api.web3.eth.accounts[0]});
});

router.post('/createContract', function(req, res) {
	//console.log('Log: In CreateContract method of server',res);
    var _data = req.body;
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var privateKey = _data.privateKey;
    var constructorParam = _data.constructorParam;
    var _args = getArguments(constructorParam);
    var libraryId = _data.libraryId;
    var libraryName = _data.libraryName;

    try{
    var callBackWithInstanceImpl= function(contractAddress,contractInstance,transactionObj){
    	var transactionHash = transactionObj.transactionHash;
    	console.log('****NodeServer**CreateContract***Contract Created at address :',contractAddress);

    	var newAddressPromise = salesforce.insertSObject('dapps__Address__c', [{name:'Name', value : contractAddress},{name: 'RecordTypeId', value : '01241000000j1fLAAQ'}]);

    	newAddressPromise.then(function(addressReference){
    		var referenceAddress  = addressReference.id;
    		setTimeout(function(){
    			service.updateTransaction(transactionObj,[
    										{name : 'dapps__Address__c', value :addressReference.id }
								], {
								sObjectType : 'dapps__Smart_Contract__c',
								fields : [
											{ name : 'dapps__Address2__c', value : addressReference.id},
										    { name : 'dapps__Contract_Address_Hash__c', value : contractAddress}
										  ],
								referenceName : 'dapps__smart_contract__c'
							});
    		},3000);
    	});
    	//call sf method to store token
    	var tokenObj;
        if(JSON.stringify(contractInstance.abi).indexOf('totalSupply') > -1){
            console.log('in contrance instance')
            tokenObj = {
              "dapps__Total_Supply__c": contractInstance.totalSupply(),
              "dapps__Symbol__c": contractInstance.symbol(),
              "name": contractInstance.name(),
              "dapps__Contract_Address__c": contractAddress
            };
        }

        console.log('####tokenObj', tokenObj);

    	if(tokenObj)salesforce.createToken(tokenObj);
    	res.send(contractAddress);
    }

    var initTransactionCallBack = function(error, transactionHash){
    	var newContractPromise = salesforce.insertSObject('dapps__Smart_Contract__c', [
    			{name:'Name', value : libraryName},
    			{name:'dapps__Library__c', value : libraryId}
    		]);

    	newContractPromise.then(function(referenceContract){
    		var referenceContractId = referenceContract.id;
    		console.log('referenceContractId:',referenceContractId);
    		var newTransactionPromise = salesforce.insertSObject('dapps__Transactions__c', [
    				{name : 'Name', value : libraryName + ' - Deployment'},
    				{name : 'dapps__Smart_Contract__c', value : referenceContractId},
    				{name : 'dapps__TxHash__c', value : transactionHash}

    			]);
    	});
    }

	var contractDef = web3Api.loadContract(abi);
    web3Api.createContractNew(contractDef,
    		{	data : byteData,
    			from: fromAddress
    		},privateKey,
    		initTransactionCallBack,
    		callBackWithInstanceImpl,_args);
	}catch(e){
		console.log('exception:',e);
	}
});

router.post('/createContract2', function(req, res) {
	//console.log('Log: In CreateContract method of server',res);
    var _data = req.body;
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var privateKey = _data.privateKey;
    var constructorParam = _data.constructorParam;
    var _args = getArguments(constructorParam);
    var libraryId = _data.libraryId;
    var libraryName = _data.libraryName;

    try{
    var callBackWithInstanceImpl= function(contractAddress,contractInstance,transactionObj){
    	var transactionHash = transactionObj.transactionHash;
    	console.log('****NodeServer**CreateContract***Contract Created at address :',contractAddress);

    	var newAddressPromise = salesforce.insertSObject('dapps__Address__c', [{name:'Name', value : contractAddress},{name: 'RecordTypeId', value : '01241000000j1fLAAQ'}]);

    	newAddressPromise.then(function(addressReference){
    		var referenceAddress  = addressReference.id;
    		setTimeout(function(){
    			service.updateTransaction(transactionObj,[
    										{name : 'dapps__Address__c', value :addressReference.id }
								], {
								sObjectType : 'dapps__Smart_Contract__c',
								fields : [
											{ name : 'dapps__Address2__c', value : addressReference.id},
										    { name : 'dapps__Contract_Address_Hash__c', value : contractAddress}
										  ],
								referenceName : 'dapps__smart_contract__c'
							});
    		},3000);
    	});
    	//call sf method to store token
    	var tokenObj;
        if(JSON.stringify(contractInstance.abi).indexOf('totalSupply') > -1){
            console.log('in contrance instance')
            tokenObj = {
              "dapps__Total_Supply__c": contractInstance.totalSupply(),
              "dapps__Symbol__c": contractInstance.symbol(),
              "name": contractInstance.name(),
              "dapps__Contract_Address__c": contractAddress
            };
        }

        console.log('####tokenObj', tokenObj);

    	if(tokenObj)salesforce.createToken(tokenObj);
    	res.send(contractAddress);
    }

    var initTransactionCallBack = function(error, transactionHash){
    	var newContractPromise = salesforce.insertSObject('dapps__Smart_Contract__c', [
    			{name:'Name', value : libraryName},
    			{name:'dapps__Library__c', value : libraryId}
    		]);

    	newContractPromise.then(function(referenceContract){
    		var referenceContractId = referenceContract.id;
    		console.log('referenceContractId:',referenceContractId);
    		var newTransactionPromise = salesforce.insertSObject('dapps__Transactions__c', [
    				{name : 'Name', value : libraryName + ' - Deployment'},
    				{name : 'dapps__Smart_Contract__c', value : referenceContractId},
    				{name : 'dapps__TxHash__c', value : transactionHash}

    			]);
    	});
    }

	var contractDef = web3Api.loadContract(abi);
    web3Api.createContractNew(contractDef,
    		{	data : byteData,
    			from: fromAddress
    		},privateKey,
    		initTransactionCallBack,
    		callBackWithInstanceImpl,_args);
	}catch(e){
		console.log('exception:',e);
	}
});


router.post('/createContractSign', function(req, res) {
	//console.log('Log: In CreateContract method of server',res);
    var _data = req.body;
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var privateKey = _data.privateKey;
    var constructorParam = _data.constructorParam;
    var _args = getArguments(constructorParam);
    var libraryId = _data.libraryId;
    var libraryName = _data.libraryName;
    var ethereumPassword = _data.ethereumPassword;
    var trasactionPassword = _data.transactionPassword;
    var signUsingOption = _data.signUsingOption;

    console.log('####libraryName', libraryName);
    var params = {
    	signUsingOption : signUsingOption,
    	isRegistered : true,
    	accountId :fromAddress,
    	ethereumPassword : ethereumPassword,
    	privateKey : privateKey
    };
    var newPrivateKey = utilService.getPrivateKey(params);
     console.log('####newPrivateKey', newPrivateKey);


    try{
    var callBackWithInstanceImpl= function(contractAddress,contractInstance,transactionObj){
    	var transactionHash = transactionObj.transactionHash;
    	console.log('****NodeServer**CreateContract***Contract Created at address :',contractAddress);

    	var newAddressPromise = salesforce.insertSObject('dapps__Address__c', [{name:'Name', value : contractAddress},{name: 'RecordTypeId', value : '01241000000j1fLAAQ'}]);

    	newAddressPromise.then(function(addressReference){
    		var referenceAddress  = addressReference.id;
    		setTimeout(function(){
    			service.updateTransaction(transactionObj,[
    										{name : 'dapps__Address__c', value :addressReference.id }
								], {
								sObjectType : 'dapps__Smart_Contract__c',
								fields : [
											{ name : 'dapps__Address2__c', value : addressReference.id},
										    { name : 'dapps__Contract_Address_Hash__c', value : contractAddress}
										  ],
								referenceName : 'dapps__smart_contract__c'
							});
    		},3000);
    	});
    	//call sf method to store token
    	var tokenObj;
        if(JSON.stringify(contractInstance.abi).indexOf('totalSupply') > -1){
            console.log('in contrance instance')
            tokenObj = {
              "dapps__Total_Supply__c": contractInstance.totalSupply(),
              "dapps__Symbol__c": contractInstance.symbol(),
              "name": contractInstance.name(),
              "dapps__Contract_Address__c": contractAddress
            };
        }

        console.log('####tokenObj', tokenObj);

    	if(tokenObj)salesforce.createToken(tokenObj);
    	res.send(contractAddress);
    }

    var initTransactionCallBack = function(error, transactionHash){
    	var newContractPromise = salesforce.insertSObject('dapps__Smart_Contract__c', [
    			{name:'Name', value : libraryName},
    			{name:'dapps__Library__c', value : libraryId}
    		]);

    	newContractPromise.then(function(referenceContract){
    		var referenceContractId = referenceContract.id;
    		console.log('referenceContractId:',referenceContractId);
    		var newTransactionPromise = salesforce.insertSObject('dapps__Transactions__c', [
    				{name : 'Name', value : libraryName + ' - Deployment'},
    				{name : 'dapps__Smart_Contract__c', value : referenceContractId},
    				{name : 'dapps__TxHash__c', value : transactionHash}

    			]);
    	});
    }

	var contractDef = web3Api.loadContract(abi);
    web3Api.createContractNew(contractDef,
    		{	data : byteData,
    			from: fromAddress
    		},newPrivateKey,
    		initTransactionCallBack,
    		callBackWithInstanceImpl,_args);
	}catch(e){
		console.log('exception:',e);
	}





});

router.post('/createContractSign2', function(req, res) {
	//console.log('Log: In CreateContract method of server',res);
	let devconsole = logger.getLogger('***index.js***createContractSign2***');
    let jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    console.log('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;


    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
            let secretKey = parsedRequest.secretKey;
            devconsole.debug('***orgObj***',secretKey);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);

			var abi  = _data.abi;
		    var byteData = _data.byteData;
		    var fromAddress = _data.from;
		    var privateKey = _data.privateKey;
		    var constructorParam = _data.constructorParam;
		    var _args = getArguments(constructorParam);
		    var libraryId = _data.libraryId;
		    var libraryName = _data.libraryName;
		    var ethereumPassword = _data.ethereumPassword;
		    var trasactionPassword = _data.transactionPassword;
			var signUsingOption = _data.signUsingOption;
			var contractAddressRecordTypeId = _data.contractAddressRecordTypeId;
		    let userId = parsedRequest.userId;
		    let environment = parsedRequest.environment;
            let oAuthToken = {userId : userId, orgId : orgId, environment : environment};

		    var params = {
		    	signUsingOption : signUsingOption,
		    	isRegistered : true,
		    	accountId :fromAddress,
		    	ethereumPassword : ethereumPassword,
		    	privateKey : privateKey
		    };
		    


		    try{
		    var callBackWithInstanceImpl= function(contractAddress,contractInstance,transactionObj){
		    	var transactionHash = transactionObj.transactionHash;
		    	devconsole.debug('****NodeServer**CreateContract***Contract Created at address :',contractAddress);
                 //Moved from downside for response time
                 //res.send(contractAddress);
                //  var finalResponse = encryptService.packageResponse({data : contractAddress},secretKey, (responseToBeSent)=>{
                //             responseToBeSent.statusCode = 200;
                //             responseToBeSent.status = 'SUCCESS';
                //         });
                // devconsole.debug('####finalResponse', finalResponse);
                // res.json(finalResponse);
                res.json(prepareResponse('SUCCESS',{data : contractAddress}));

                console.log('****NodeServer**CreateContract***After Send***');
		    	var newAddressPromise = salesforceEndpoint.insertSObject(oAuthToken,'dapps__Address__c', [{name:'Name', value : contractAddress},{name: 'RecordTypeId', value : contractAddressRecordTypeId}]);

		    	newAddressPromise.then(function(addressReference){
		    		var referenceAddress  = addressReference.id;
		    		setTimeout(function(){
		    			service.updateTransaction({userId : userId, orgId:orgId, environment :environment},transactionObj,[
		    										{name : 'dapps__Address__c', value :addressReference.id }
										], {
										sObjectType : 'dapps__Smart_Contract__c',
										fields : [
													{ name : 'dapps__Address2__c', value : addressReference.id},
												    { name : 'dapps__Contract_Address_Hash__c', value : contractAddress}
												  ],
										referenceName : 'dapps__smart_contract__c'
									});					

		    		},3000);
		    	});
		    	//call sf method to store token
				
				let tokenObj;
				if(JSON.stringify(contractInstance.abi).indexOf('totalSupply') > -1){
					devconsole.debug('in contrance instance')
					tokenObj = {
					"dapps__Total_Supply__c": contractInstance.totalSupply(),
					"dapps__Symbol__c": contractInstance.symbol(),
					"name": contractInstance.name(),
					"dapps__Contract_Address__c": contractAddress
					};
				}

				devconsole.debug('####tokenObj', tokenObj);

				if(tokenObj)salesforceEndpoint.insertSObject(oAuthToken,'dapps__Token__c', [{name:'Name', value : contractInstance.name()},{name:'dapps__Total_Supply__c', value : contractInstance.totalSupply()},{name:'dapps__Symbol__c', value : contractInstance.symbol()},{name: 'dapps__Contract_Address__c', value : contractAddress}]);
				// var finalResponse = encryptService.packageResponse({data : contractAddress},secretKey, (responseToBeSent)=>{
    //                         responseToBeSent.statusCode = 200;
    //                         responseToBeSent.status = 'SUCCESS';
    //                     });
    //             devconsole.debug('####finalResponse', finalResponse);
    //             res.json(finalResponse);
						
		    	//res.json({statusCode : 200, data : contractAddress}); //Moving on top so that client Response time reduce
		    }

		    var initTransactionCallBack = function(error, transactionHash){

                if(!transactionHash){
                    if(error == 'Error: insufficient funds for gas * price + value'){
                        res.json(prepareResponse('ERROR',{message : 'Ether wrong key or insufficient balance in provided account.'}));
                    }else{
                        res.json(prepareResponse('ERROR',{message : 'Something went wrong while creating smart contract'}));
                    }
                }else{
                    var newContractPromise = salesforceEndpoint.insertSObject(oAuthToken,'dapps__Smart_Contract__c', [
                            {name:'Name', value : libraryName},
                            {name:'dapps__Library__c', value : libraryId}
                        ]);

                    newContractPromise.then(function(referenceContract){
                        var referenceContractId = referenceContract.id;
                        console.log('referenceContractId:',referenceContractId);
                        var newTransactionPromise = salesforceEndpoint.insertSObject(oAuthToken,'dapps__Transactions__c', [
                                {name : 'Name', value : libraryName + ' - Deployment'},
                                {name : 'dapps__Smart_Contract__c', value : referenceContractId},
                                {name : 'dapps__TxHash__c', value : transactionHash}

                            ]);
                    });
                    newContractPromise.catch(function(newContractError){
                        if(newContractError && !newContractError.loggedIn){
                            res.json(prepareResponse('ERROR',{message : 'You are not verified with Dapps, verify and try again'}));
                        }
                        else{
                            res.json(prepareResponse('ERROR',{message : 'Something went wrong while storing data back to salesforce.'}));
                        }
                        
                    });
                }
		    }
            var newPrivateKeyPromise = utilService.getPrivateKey(params);
            newPrivateKeyPromise.then(function(newPrivateKey){
                devconsole.debug('####newPrivateKey', newPrivateKey);
                if(!newPrivateKey){
                    res.json(prepareResponse('ERROR',{message : 'Either etherem password or private key is wrong.'}));
                }
                else{
                    var contractDef = web3Api.loadContract(abi);
                    web3Api.createContractNew(contractDef,
                            {   data : byteData,
                                from: fromAddress
                            },newPrivateKey,
                            initTransactionCallBack,
                            callBackWithInstanceImpl,_args);
                }

            });

			}catch(e){
				devconsole.error('exception:',e);
			}
		}
	).catch(function(errorJson,secretKey){
        //res.json(error);
        // res.json(encryptService.packageResponse(errorJson),errorJson.secretKey, (responseToBeSent)=>{
        //             responseToBeSent.secretKey = null;
        //             responseToBeSent.statusCode = 500;
        //             responseToBeSent.status = 'ERROR';
        // });
        res.json(prepareResponse('ERROR'));
    });
   
    
});


router.post('/savecontracttolibrary2', function(req, res) {
	//console.log('Log: In CreateContract method of server',res);
	let devconsole = logger.getLogger('***index.js***savecontracttolibrary2***');
    let jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;


    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);			
		    
		    let userId = parsedRequest.userId;
		    let environment = parsedRequest.environment;
            let oAuthToken = {userId : userId, orgId : orgId, environment : environment};    


		    try{		    

		    	let insertLibrary = salesforceEndpoint.insertSObject(oAuthToken,'dapps__Library__c', mapObjectToNameValue(_data));

		    	insertLibrary.then(function(id){
					console.log("Saved Library", id);
					res.send(id);
		    	});
		    	
		    	
			}catch(e){
				res.send("Error: "+e);
				console.log("Error: ",e);
			}
		   
		}
	);
   
    
});

let mapObjectToNameValue = function(obj){

	let devconsole = logger.getLogger('***index.js***mapObjectToNameValue***');    	
	
	let nameValueArray = [];
	Object.keys(obj).forEach(function(key) {
		let tempObj = {};
		devconsole.debug('***obj***',obj);

		tempObj.name = key;
		tempObj.value = obj[key];
		nameValueArray.push(tempObj);	

	});

	return nameValueArray;
	
}



router.post('/call', function(req, res) {
	
    var _data = req.body;
    console.log('Log: In Call method of server : _data:',_data);
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var _address = _data.address;
    var constructorParam = _data.methodArgs;
    var _args = getArguments(constructorParam);
    var _methodName = _data.methodName;


    try{
	web3Api.call({
		abi : abi,
		args : _args,
		transactObj : {
			from : fromAddress,
			data:byteData
		},
		address : _address,
		methodName : _methodName,
		callbackFn : function(error,result){
			console.log('@@@@In Call',error,result);
			if(result)
				res.send(result);
		}
	});

	}catch(e){
		console.log('exception:',e);
	}


});

router.post('/sendTransaction', function(req, res) {
	//console.log('Log: In sendTransaction method of server', req.body);
    var _data = req.body;
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var privateKey = _data.privateKey;
    var _address = _data.address;
    var constructorParam = _data.methodArgs;
    var _args = getArguments(constructorParam);
    var _methodName = _data.methodName;
    var libraryId = _data.libraryId;
    var libraryName = _data.libraryName;

    //token details
	var token;
	if(_data.hasOwnProperty('token')){
	    token =  _data.token;
	    //console.log("######token", token);
	}

    try{
	var inputParams  = {
		abi : abi,
		args : _args,
		from : fromAddress,
		data:byteData,
		address : _address,
		methodName : _methodName,
		privateKey : privateKey
	}
	var callbackImpl = function(error, transactionHash){
		console.log('***sendTransaction***transactionHash:',transactionHash);


		var newTransactionPromise = salesforce.insertSObject('dapps__Transactions__c', [
				{name : 'Name', value : libraryName + '- Transaction'},
				{name : 'dapps__Contract_Address_Hash__c', value : _address},
				{name : 'dapps__TxHash__c', value : transactionHash}
			]);

		//insert token
		if(token){

			setTimeout(function(){
					salesforce.insertSObject('dapps__Token_Transfers__c', [
						{name : 'name', value : token.name},
						{name : 'dapps__Contract_Address__c', value : _address},
						{name : 'dapps__From_Address__c', value : token.from},
						{name : 'dapps__To_Address__c', value : token.to},
						{name : 'dapps__Value__c', value : token.tokenvalue},
						{name : 'dapps__Transaction_Hash__c', value : transactionHash}
					]);
			},3000);
			//var newTokenInsertPromise =
		}

		res.send(transactionHash);
	}
	web3Api.sendTransactionNew(inputParams,callbackImpl,function(error,transactionObj){

		console.log('Send Transaction Completed with Block Number:',transactionObj.blockNumber);
		console.log('***sendTransaction***transactionObj:',transactionObj);

		//service.updateTransaction(transactionObj);
		service.updateTransaction(transactionObj);

    	});

	}catch(e){
		console.log('exception:',e);
	}


});


router.post('/sendTransactionSign', function(req, res) {
	//console.log('Log: In sendTransaction method of server', req.body);
    var _data = req.body;
    var abi  = _data.abi;
    var byteData = _data.byteData;
    var fromAddress = _data.from;
    var privateKey = _data.privateKey;
    var _address = _data.address;
    var constructorParam = _data.methodArgs;
    var _args = getArguments(constructorParam);
    var _methodName = _data.methodName;
    var libraryId = _data.libraryId;
    var libraryName = _data.libraryName;
    var ethereumPassword = _data.ethereumPassword;
    var trasactionPassword = _data.transactionPassword;
    var signUsingOption = _data.signUsingOption;

    var params = {
    	signUsingOption : signUsingOption,
    	isRegistered : true,
    	accountId :fromAddress,
    	ethereumPassword : ethereumPassword,
    	privateKey : privateKey
    };
    var newPrivateKey = utilService.getPrivateKey(params);
     console.log('####newPrivateKey', newPrivateKey);

    //token details
	var token;
	if(_data.hasOwnProperty('token')){
	    token =  _data.token;
	    //console.log("######token", token);
	}

    try{
	var inputParams  = {
		abi : abi,
		args : _args,
		from : fromAddress,
		data:byteData,
		address : _address,
		methodName : _methodName,
		privateKey : newPrivateKey
	}
	var callbackImpl = function(error, transactionHash){
		console.log('***sendTransaction***transactionHash:',transactionHash);


		var newTransactionPromise = salesforce.insertSObject('dapps__Transactions__c', [
				{name : 'Name', value : libraryName + '- Transaction'},
				{name : 'dapps__Contract_Address_Hash__c', value : _address},
				{name : 'dapps__TxHash__c', value : transactionHash}
			]);

		//insert token
		if(token){

			setTimeout(function(){
					salesforce.insertSObject('dapps__Token_Transfers__c', [
						{name : 'name', value : token.name},
						{name : 'dapps__Contract_Address__c', value : _address},
						{name : 'dapps__From_Address__c', value : token.from},
						{name : 'dapps__To_Address__c', value : token.to},
						{name : 'dapps__Value__c', value : token.tokenvalue},
						{name : 'dapps__Transaction_Hash__c', value : transactionHash}
					]);
			},3000);
			//var newTokenInsertPromise =
		}

		res.send(transactionHash);
	}
	web3Api.sendTransactionNew(inputParams,callbackImpl,function(error,transactionObj){

		console.log('datajsonSend Transaction Completed with Block Number:',transactionObj.blockNumber);
		console.log('***sendTransaction***transactionObj:',transactionObj);

		//service.updateTransaction(transactionObj);
		service.updateTransaction(transactionObj);

    	});

	}catch(e){
		console.log('exception:',e);
	}


});


router.post('/sendTransactionSign2', function(req, res) {
	let devconsole = logger.getLogger('***index.js***sendTransactionSign2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);

			var abi  = _data.abi;
		    var byteData = _data.byteData;
		    var fromAddress = _data.from;
		    var privateKey = _data.privateKey;
		    var _address = _data.address;
		    var constructorParam = _data.methodArgs;
		    var _args = getArguments(constructorParam);
		    var _methodName = _data.methodName;
		    var libraryId = _data.libraryId;
		    var libraryName = _data.libraryName;
		    var ethereumPassword = _data.ethereumPassword;
		    var trasactionPassword = _data.transactionPassword;
		    var signUsingOption = _data.signUsingOption;
		    let userId = parsedRequest.userId;
		    let environment = parsedRequest.environment;
		    let oAuthToken = {userId : userId, orgId : orgId, environment : environment};

		    var params = {
		    	signUsingOption : signUsingOption,
		    	isRegistered : true,
		    	accountId :fromAddress,
		    	ethereumPassword : ethereumPassword,
		    	privateKey : privateKey
		    };
		    

		    //token details
			var token;
			if(_data.hasOwnProperty('token')){
			    token =  _data.token;
			    //console.log("######token", token);
			}

		    try{

			var callbackImpl = function(error, transactionHash){
				devconsole.debug('***transactionHash:',transactionHash);


				var newTransactionPromise = salesforceEndpoint.insertSObject(oAuthToken,'dapps__Transactions__c', [
						{name : 'Name', value : libraryName + '- Transaction'},
						{name : 'dapps__Contract_Address_Hash__c', value : _address},
						{name : 'dapps__TxHash__c', value : transactionHash}
					]);

				//insert token
				if(token){

					setTimeout(function(){
							salesforceEndpoint.insertSObject(oAuthToken,'dapps__Token_Transfers__c', [
								{name : 'name', value : token.name},
								{name : 'dapps__Contract_Address__c', value : _address},
								{name : 'dapps__From_Address__c', value : token.from},
								{name : 'dapps__To_Address__c', value : token.to},
								{name : 'dapps__Value__c', value : token.tokenvalue},
								{name : 'dapps__Transaction_Hash__c', value : transactionHash}
							]);
					},3000);
					//var newTokenInsertPromise =
				}

				res.send(transactionHash);
			}
            var newPrivateKeyPromise = utilService.getPrivateKey(params);
            newPrivateKeyPromise.then(function(newPrivateKey){
                devconsole.debug('####newPrivateKey', newPrivateKey);
                var inputParams  = {
                    abi : abi,
                    args : _args,
                    from : fromAddress,
                    data:byteData,
                    address : _address,
                    methodName : _methodName,
                    privateKey : newPrivateKey
                }
                web3Api.sendTransactionNew(inputParams,callbackImpl,function(error,transactionObj){
                    console.log('datajsonSend Transaction Completed with Block Number:',transactionObj.blockNumber);
                    console.log('***sendTransaction***transactionObj:',transactionObj);
                    setTimeout(function(){
                            service.updateTransaction(oAuthToken,transactionObj);
                        },3000);
                    });    
            });
            
            
            

			}catch(e){
				console.log('exception:',e);
			}
		}
	);




});



// router.post('/sendTransactionSign2', function(req, res) {

// 	let devconsole = logger.getLogger('***Index.js***createAccountTest2***'); //Change1
// 	var datajson = req.body;
// 	var reqStrEncrypted = datajson.reqStr;
// 	const orgId = datajson.orgId;

// 	var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
// 	reqPromise.then(
// 		function(_data,orgObj){
// 			devconsole.debug('***_data***',_data);

// 			    var abi  = _data.abi;
// 			    var byteData = _data.byteData;
// 			    var fromAddress = _data.from;
// 			    var privateKey = _data.privateKey;
// 			    var _address = _data.address;
// 			    var constructorParam = _data.methodArgs;
// 			    var _args = getArguments(constructorParam);
// 			    var _methodName = _data.methodName;
// 			    var libraryId = _data.libraryId;
// 			    var libraryName = _data.libraryName;
// 			    var ethereumPassword = _data.ethereumPassword;
// 			    var trasactionPassword = _data.transactionPassword;
// 			    var signUsingOption = _data.signUsingOption;

// 			    //To Be Added in Salesforce Request
// 			    var userId = _data.userId;

// 			    var environment = orgObj.environment;

// 			    var params = {
// 			    	signUsingOption : signUsingOption,
// 			    	isRegistered : true,
// 			    	accountId :fromAddress,
// 			    	ethereumPassword : ethereumPassword,
// 			    	privateKey : privateKey
// 			    };

// 			    var newPrivateKey = utilService.getPrivateKey(params);
// 			    devconsole.debug('***newPrivateKey***', newPrivateKey);

// 			    //token details
// 				var token;
// 				if(_data.hasOwnProperty('token')){
// 				    token =  _data.token;
// 				    //console.log("######token", token);
// 				}

// 			    try{
// 				var inputParams  = {
// 					abi : abi,
// 					args : _args,
// 					from : fromAddress,
// 					data:byteData,
// 					address : _address,
// 					methodName : _methodName,
// 					privateKey : newPrivateKey
// 				}
// 				var callbackImpl = function(error, transactionHash){
// 					devconsole.debug('***sendTransaction***transactionHash:',transactionHash);


// 					var newTransactionPromise = salesforceEndpoint.insertSObject(
// 							{orgId: orgId, userId: userId, environment: environment},
// 							'dapps__Transactions__c', 
// 							[
// 								{name : 'Name', value : libraryName + '- Transaction'},
// 								{name : 'dapps__Contract_Address_Hash__c', value : _address},
// 								{name : 'dapps__TxHash__c', value : transactionHash}
// 							]);

// 					//insert token
// 					if(token){

// 						setTimeout(function(){
// 								salesforce.insertSObject(
// 									{orgId: orgId, userId: userId, environment: environment},
// 									'dapps__Token_Transfers__c', 
// 									[
// 										{name : 'name', value : token.name},
// 										{name : 'dapps__Contract_Address__c', value : _address},
// 										{name : 'dapps__From_Address__c', value : token.from},
// 										{name : 'dapps__To_Address__c', value : token.to},
// 										{name : 'dapps__Value__c', value : token.tokenvalue},
// 										{name : 'dapps__Transaction_Hash__c', value : transactionHash}
// 									]);
// 						},3000);
// 						//var newTokenInsertPromise =
// 					}

// 					res.send(transactionHash);
// 				}
// 				web3Api.sendTransactionNew(inputParams,callbackImpl,function(error,transactionObj){

// 					devconsole.debug('datajsonSend Transaction Completed with Block Number:',transactionObj.blockNumber);
// 					devconsole.debug('***sendTransaction***transactionObj:',transactionObj);

// 					//service.updateTransaction(transactionObj);
// 					salesforceEndpoint.updateTransaction({orgId: orgId, userId: userId, environment: environment},transactionObj);

// 			    	});

// 				}catch(e){
// 					devconsole.error('exception:',e);
// 				}
			
// 		}
// 	).error(function(error){
// 		devconsole.debug('***error***',error);
// 	});

//     //var _data = req.body;



// });



//compile api
//sample req parameter {type:"solidity", sourcecode:"solidity code"}
router.post('/compile', function(req, res) {
	console.log("####### req", req.body);
    web3Api.compile(req.body,
    		function(error,result){
    			//result will have solc object which can be used to compile

		    	if(result){
		    		res.send(result.compile(req.body.sourcecode));
		    	}else if(error){
		    		res.send(String(error));
		    	}else{
		    		res.send("Something went worng, please refresh and try again!");
		    	}
		     });
});


router.post('/compile2', function(req, res) {

	let devconsole = logger.getLogger('***index.js***compile2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
	let orgId = jsonBody.orgId;
	
    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);

			let sourcecode = _data.sourcecode;
			
			web3Api.compile(_data,
					function(error,result){
						//result will have solc object which can be used to compile

						if(result){
							res.send(result.compile(sourcecode));
						}else if(error){
							res.send(String(error));
						}else{
							res.send("Something went worng, please refresh and try again!");
						}
					});
			
		}
	).catch(function(error){
		devconsole.debug('***error***',error);
	});
	
});


router.post('/verifyUser', function(req, res) {

	let devconsole = logger.getLogger('***index.js***verifyUser***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
	let orgId = jsonBody.orgId;
	
    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);
			
			let userId = parsedRequest.userId;
		    let environment = parsedRequest.environment;
			let oAuthToken = {userId : userId, orgId : orgId, environment : environment};
			
			salesforceEndpoint.processRequest(oAuthToken)
			.then(function(result){
				if(result.response && result.response.oauth){
					delete result.response.oauth;
				}
				if(result.org){
					delete result.org;
				}
				res.send(result);				
			})
			.catch(function (error) {
				res.send(error);				
			});

		}
	).catch(function(error){		
		devconsole.debug('***error***',error);
	});
	
});


//compile and save contract api
//sample req parameter {Name:"name of contract", Code__c :"solidity code", Byte_Code__c : "bytecode", Languge__c: "language"}
router.post('/savecontracttolibrary', function(req, res) {
	var dapps__Library__c = req.body;
	//console.log("#######", dapps__Library__c);
    salesforce.savecontracttolibrary(dapps__Library__c, function(error, result){
    	if(result){
    		res.send(result);
    	}else if(error){
    		res.send(error);
    	}
    });
});

//general fucntion query records from SF. Pass on the query and callback function
//sample req parameter query, callack(val)
router.post('/getRecordsByQuery', function(req, res) {
	let devconsole = logger.getLogger('***index.js***getRecordsByQuery***');
	var _data = req.body;
	var query = _data.query;
	var userId = _data.userId;
	var orgId = _data.orgId;
	var environment = _data.environment;

	devconsole.debug("***_data***", _data);

	// var queryPromise = salesforceEndpoint.getRecordsByQuery({orgId : orgId, userId : userId, environment : environment},query);
	// queryPromise.then(function(records){
	// 	res.send(result);
	// }).catch(function(error){
	// 	devconsole.error("***error***", error);
	// });

	salesforce.getRecordsByQuery(query, function(records){
		res.send(records);
	});

    
});


//store address, params - obj (name: 123name, type: contract)
router.post('/createAddress', function(req, res) {
	//console.log("####addressObj", req);
	var addressObj = req.body;
	console.log("####addressObj", addressObj);
	salesforce.createAddress(addressObj, function(result){
		console.log("####error", result);
    	res.send(result);
    });
});

//create contract
router.post('/createContractRecord', function(req, res) {
	//console.log("####createContract", req);
	var contractObj = req.body;
	console.log("####createContract", contractObj);
	salesforce.createContractRecord(contractObj, function(result){
		console.log("####error", result);
    	res.send(result);
    });
});

//create contract
router.post('/getPrivateKeyFromFile', function(req, res) {
	//console.log("####createContract", req);
	var _body = req.body;
	var _fileStr = _body.file;
	var _password = _body.password;

	console.log('***NodeServer:getPrivateKeyFromFile***');
	console.log('***NodeServer:getPrivateKeyFromFile:_fileStr***',_fileStr);
	console.log('***NodeServer:getPrivateKeyFromFile:_password***',_password);
	var _response = {status : 'success', result : ''};
	var privateKey = utilService.getWalletFromPrivKeyFile(_fileStr,_password);
	if(!privateKey){
		_response.status = 'error';
	}
	_response.result = privateKey;
	res.send(_response);
});

var updateContract = function(result){
	var contractObj = {};
	contractObj.id = "a034100000Jsnk7";
	//contractObj.name = "New Smart Contract";
	contractObj.dapps__Address__c = result.address;
	salesforce.updateContract(contractObj, result, setTransaction);
}



var setAddress = function(contractAddress, result){
	//var addressObj = contractObj.Address__c;
	salesforce.setAddress(addressObj, function(val){
		console.log("####sf new address created, val");
	});
}

var setTransaction = function(contractAddress, result){
	console.log("####in set trans sf trans record id");
	var transactObj = convertNewContractToTransObj(result);
	salesforce.setTransaction(transactObj, function(val){
		console.log("####sf trans record id", val);
	});
}

var convertNewContractToTransObj = function(result){
	var transactObj = {};
	var getTransactionReceipt = result._eth.getTransactionReceipt(result.transactionHash);
	var getTransaction = result._eth.getTransaction(result.transactionHash);
	var getBlock = result._eth.getBlock(getTransaction.blockHash);
	transactObj.dapps__Smart_Contract__c = "a034100000Jsnk7";
	transactObj.dapps__Address__c = result.address;
	transactObj.dapps__Block__c = getTransactionReceipt.blockNumber;
	transactObj.dapps__Blockchain__c = "Ethereum";
	transactObj.dapps__Gas__c = getTransaction.gas;
	transactObj.dapps__Gas_Price__c = getTransaction.gasPrice.toString(10);
	transactObj.dapps__Gas_Used__c = getTransactionReceipt.gasUsed;
	transactObj.dapps__TimeStamp__c = getBlock.timestamp;
	transactObj.dapps__TxHash__c = result.transactionHash;
	transactObj.Name = result.transactionHash;
	//console.log("########convertNewContractToTransObj", result._eth.getTransactionReceipt(result.transactionHash));
	console.log("########convertNewContractToTransObj", transactObj);

	return transactObj;
	//return JSON.stringify(transactObj);
}


// more routes for our API will happen here

//create Key Pair

router.post('/createKeyPair', function(req, res) {
	var _keyObj = req.keyObj;
	var _password = _keyObj.password;
	var _orgId = _keyObj.orgId;
	var params = { keyBytes: 32, ivBytes: 16 };
	console.log("####createKeyPair", keyObj);


	//keythereum.create(params, function (result) {
	generateKey.privateKeyToAddress(keyObj, function(result){
		console.log("####error", result);
    	res.send(result);
    });
});


//export Key Pair

router.post('/exportKey'), function(req, res) {

keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
  // do stuff!
});
}

//import Key Pair

router.post('/importKey', function(req, res) {

	// Asynchronous
	keythereum.importFromFile(address, datadir, function (keyObject) {
	  // do stuff
	});

})

// SQL APIS

router.post('/querySQL', function(req, res) {

// Query OrgId and the Account


})


router.post('/insertSQL', function(req, res) {


// Insert new OrgId and Account

});

router.post('/publicEncrypt', function(req, res) {
	console.log('***inside : publicEncrypt ***');
	var datajson = req.body;
	var plainText = datajson.plainText;
	var privateKey = datajson.privateKey;

	console.log('***datajson : ***',datajson);
	console.log('***datajson.plainText : ***',datajson.plainText);
	console.log('***datajson.privateKey : ***',datajson.privateKey);

	var responseToBeSent = {};
	//responseToBeSent["data"] =  encryptService.encryptString(plainText,privateKey);
	var encryptedData =  encryptService.encryptString(plainText,privateKey);
	console.log('***publicEncrypt - encryptedData : ***',encryptedData);
	res.json(encryptedData);
});
router.post('/publicDecrypt', function(req, res) {
	var datajson = req.body;
	var encryptedText = datajson.encryptedText;
	var privateKey = datajson.privateKey;

	var responseToBeSent = {};
	console.log('***Public Decrypt***encryptedText :',encryptedText);
	//responseToBeSent["data"] =  encryptService.decryptString(encryptedText,privateKey);
	var plainData =  encryptService.decryptString(encryptedText,privateKey);
	res.json(plainData);
});


router.post('/createAccount', function(req, res) {
	let devconsole = logger.getLogger('***Index.js***createAccount***');
	var datajson = req.body;
	var reqStrEncrypted = datajson.reqStr;
	const orgId = datajson.orgId;

	daoService.findByIdOrg(orgId)
	 .then(function(orgObj){
	    devconsole.debug('***IorgObj***',orgObj);

		const privateKey = orgObj.information;
		let parsedRequest = encryptService.parseServerRequest(reqStrEncrypted,privateKey);
		devconsole.debug('***parsedRequest***',parsedRequest);
		let ethereumPassword = parsedRequest.ethereumPassword;
		let userId = parsedRequest.userId;

		var keyObj = keythereumApi.createEthereumAccount(ethereumPassword,orgId,userId,false);
		var response = {} ;
		response.keyObj = keyObj;

		let responseToBeSent = encryptService.packageResponse(response,privateKey, function(response){
			response.property3 = 'value3',
			response.property4 = 'value4'
		});

		res.json(responseToBeSent);
		
	 }); 

	
});

syncGethNode();

let createAccountCommon = function(orgId,parsedRequest){
    let devconsole = logger.getLogger('***index.js***createAccountCommon***');
    let dataStr = parsedRequest.dataStr;
    let _data = JSON.parse(dataStr);
    devconsole.debug('***parsedRequest***',parsedRequest);
    devconsole.debug('***_data***',_data);

    let userId = parsedRequest.userId;
    let environment = parsedRequest.environment;

    let ethereumPassword = _data.ethereumPassword;
    let accountName = _data.accountName;
    

    var keyObj = keythereumApi.createEthereumAccount(ethereumPassword,orgId,userId,false);
    var response = {} ;
    response.keyObj = keyObj;
    response.accountName = accountName;

    var inputParams  = {
        from:'0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab', 
        to: keyObj.address, 
        value: 10 * 1000000000000000000,
        privateKey : 'cc7e9520e6aeeff853bff854442e60e935763b26cbacc56a0d072973530e59ad'
    };
    var callbackImpl = function(err, result){
      console.log('callbackImpl in createAccountCommon : result:',result);
    }

    syncGethNode();

    setTimeout(function(){
        web3Api.transfer(inputParams,callbackImpl,function(error,transactionObj){
          console.log('transfer:callbackImpl in createAccountCommon : transactionObj@@',transactionObj);
        });
    },3000);

    return response;
}

router.post('/createAccount2', function(req, res) {
	let devconsole = logger.getLogger('***index.js***createAccount2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			//devconsole.debug('***parsedRequest***',parsedRequest);
			let response = createAccountCommon(orgId,parsedRequest);
            devconsole.debug('***response***',response);
            
			res.json(prepareResponse('SUCCESS',response));
		}
	).catch(function(error){
		devconsole.debug('***In reqPromise catch***error***',error);
        res.json(prepareResponse('ERROR'));
	});
});


router.post('/verifyOrganization', function(req, res) {
	let devconsole = logger.getLogger('***Index.js***parseServerRequest***');
	devconsole.debug('***Enter in Method***');
	devconsole.debug('***req***',req.body);

	var datajson = req.body;
	var reqStrEncrypted = datajson.reqStr;
	const orgId = datajson.orgId;

	const privateKey = 'dappsai8901234567890123456789012';
	let parsedRequest = encryptService.parseServerRequest(reqStrEncrypted,privateKey);
	
	devconsole.debug('***parsedRequest***',parsedRequest);

	let aesKey = parsedRequest.privateKey;
	let orgObjUpsert = {
	    id : orgId,
	    information :  aesKey
	};

	devconsole.debug('***orgObjUpsert***',orgObjUpsert);
	daoService.createOrUpdateOrg(orgObjUpsert)
	.then(function(isCreated){
		devconsole.debug('***orgObj.isCreated***',isCreated);

		var response = {} ;
		
		let responseToBeSent = encryptService.packageResponse(response,privateKey, function(response){
			response.message = 'Organization verified successfully';
		});

		res.json(responseToBeSent);
	});
});

router.post('/verifyOrganization2', function(req, res) {
	let devconsole = logger.getLogger('***index.js***sendTransactionSign2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;
    const MASTER_KEY = 'dappsai8901234567890123456789012';
    var reqPromise = encryptService.parseServerRequestWithMasterKey(reqStrEncrypted,orgId);
	reqPromise.then(
		function(parsedRequest){
			devconsole.debug('***parsedRequest***',parsedRequest);
			let dataStr = parsedRequest.dataStr;
			let _data = JSON.parse(dataStr);
			devconsole.debug('***_data***',_data);

			let aesKey = _data.privateKey;
			let orgObjUpsert = {
			    id : orgId,
			    secretKey :  aesKey
			};

			devconsole.debug('***orgObjUpsert***',orgObjUpsert);
			daoService.createOrUpdateOrg(orgObjUpsert)
			.then(function(isCreated){
				devconsole.debug('***orgObj.isCreated***',isCreated);

				var response = {} ;
				
				let responseToBeSent = encryptService.packageResponse(response,MASTER_KEY, function(response){
					response.message = 'Organization verified successfully';
				});

				res.json(responseToBeSent);
			});
		}
	).catch(function(error){
		devconsole.debug('***error of reqPromise***',error);
		res.send(error);
	});

});

router.post('/importAccount', function(req, res) {
    let devconsole = logger.getLogger('***index.js***importAccount***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let response = utilService.importAccount(jsonBody);
    res.json(response);
    
});

router.post('/importAccount2', function(req, res) {
    let devconsole = logger.getLogger('***index.js***importAccount2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
    reqPromise.then(
        function(parsedRequest){
            devconsole.debug('***parsedRequest***',parsedRequest);
            let dataStr = parsedRequest.dataStr;
            let _data = JSON.parse(dataStr);
            devconsole.debug('***_data***',_data);

            let _responsePromise = utilService.importAccount(_data);
            _responsePromise.then(function(_importResponse){
                devconsole.debug('***_importResponse***',_importResponse);
                res.json(prepareResponse('SUCCESS',_importResponse));
            }).catch(function(_importResponse2){
                devconsole.debug('***_importResponse2***',_importResponse2);
                res.json(prepareResponse('ERROR',_importResponse2));
            });
        }
    );
});

router.post('/exportAccount', function(req, res) {
    let devconsole = logger.getLogger('***index.js***exportAccount***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let exportPromise = utilService.exportAccount(jsonBody);
    exportPromise.then(function(accountObj){
        devconsole.debug('***accountObj***',accountObj);
        res.send(JSON.stringify(accountObj));
    });
    
});

router.post('/exportAccount2', function(req, res) {
    let devconsole = logger.getLogger('***index.js***exportAccount2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
    reqPromise.then(
        function(parsedRequest){
            devconsole.debug('***parsedRequest***',parsedRequest);
            let dataStr = parsedRequest.dataStr;
            let _data = JSON.parse(dataStr);
            devconsole.debug('***_data***',_data);

            let exportPromise = utilService.exportAccount(_data);
            exportPromise.then(function(accountObj){
                devconsole.debug('***accountObj***',accountObj);
                if(accountObj){
                    res.json(prepareResponse('SUCCESS', {data:accountObj}));
                }
                else{
                    res.json(prepareResponse('ERROR',{message : 'Account with address:'+ _data.address + ' not found.'}));
                }
            }).catch(function(exportResponse){
                devconsole.debug('***exportResponse***',exportResponse);
                res.json(prepareResponse('ERROR',{message : 'Something went wrong while exporting account!'}));
            });
            
        }
    );
});


router.post('/exportPrivateKey2', function(req, res) {
    let devconsole = logger.getLogger('***index.js***exportPrivateKey2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
    reqPromise.then(
        function(parsedRequest){
            devconsole.debug('***parsedRequest***',parsedRequest);
            let dataStr = parsedRequest.dataStr;
            let _data = JSON.parse(dataStr);
            devconsole.debug('***_data***',_data);

            let exportPromise = utilService.exportPrivateKey(_data);
            exportPromise.then(function(_exportPrivateKey){
                 devconsole.debug('***_exportPrivateKey***',_exportPrivateKey);
                res.json(prepareResponse('SUCCESS',{data : _exportPrivateKey}));
            }).catch(function(exportResponse){
                devconsole.debug('***exportResponse***',exportResponse);
                res.json(prepareResponse('ERROR',exportResponse));
            });
            
        }
    );
});

let getBalanceCommon = function(accounts){
    let accountBalanceMap = {};
    if(accounts && accounts.length > 0){
        for (var i =0;i < accounts.length; i++) {
            let accId = accounts[i];
            console.log('***account***',accId);
            let bal = web3Api.getBalanceSync(accounts[i],'ether');
            console.log('***bal***',bal);
            accountBalanceMap[accId] = bal.toString();
        }
    }
    return accountBalanceMap;
}



router.post('/getBalance', function(req, res) {
    let devconsole = logger.getLogger('***index.js***getBalance***');

    let jsonBody = req.body;
    
    let accounts = jsonBody.accounts;
    devconsole.debug('***accounts***',accounts);
    let accountBalanceMap = getBalanceCommon(accounts);
    res.send(accountBalanceMap);
    
});

router.post('/getBalance2', function(req, res) {
    let devconsole = logger.getLogger('***index.js***getBalance2***');

    var jsonBody = req.body;
    devconsole.debug('***jsonBody***',jsonBody);
    let reqStrEncrypted = jsonBody.reqStr;
    let orgId = jsonBody.orgId;

    var reqPromise = encryptService.parseServerRequest2(reqStrEncrypted,orgId);
    reqPromise.then(
        function(parsedRequest){
            devconsole.debug('***parsedRequest***',parsedRequest);
            let dataStr = parsedRequest.dataStr;
            let _data = JSON.parse(dataStr);
            devconsole.debug('***_data***',_data);

            let accounts = _data.accounts;
            devconsole.debug('***accounts***',accounts);
            let accountBalanceMap = getBalanceCommon(accounts);
            res.send(accountBalanceMap);
            
        }
    );
});






router.post('/postTest', function(req, res) {
	console.log('***inside : postTest ***');
	var datajson = req.body;
	datajson.message = 'Message From Server';
	res.json(datajson);

});

router.get('/getOrgDetailTest', function(req, res) {
    daoService.findByIdOrg(req.query.id)
        .then(function(orgObj){
            console.log('***getOrgDetailTest *** orgObj.secretKey***',orgObj.secretKey);
            res.json(orgObj);
        });
});

router.get('/getLoginUri', function(req, res) {
	console.log("#####req.query.state ", req.query.environment);
	let environment = req.query.environment || "production";
	res.send(salesforceEndpoint.getLoginUri(environment));
});



// var syncGethNode = function(){
//     var options = {
//       host: ethAccountSyncUrl,
//       path: '/api/syncAccToGethNode'
//     };

//     var req = http.get(options, function(res) {
//         console.log('res::',res.data);
//     });
//     console.log('@@req@@',req);
// }



// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


//serving pages and static files
app.use('/', express.static('static'))
app.use('/.well-known/', express.static(path.join(__dirname, '.well-known')));

//serving pages

app.get('/', function(req, res) {
    //res.sendFile(path.join(__dirname + '/dappsnetwork.html'));
    res.send('Welcome to the Dapps Network');
});

//----salesforce callback 
app.get("/oauth/callback", function (req, res) {                
	//console.log("#########", req);	
    salesforceEndpoint.respondToSFDCCallback(req, res);
}); 
//----salesforce callback  end



/*
app.get('/compiler', function(req, res) {
    res.sendFile(path.join(__dirname + '/testing/SolidityCompiler.html'));
});

app.get('/createcontract', function(req, res) {
    res.sendFile(path.join(__dirname + '/testing/AbiToHTML.html'));
});
*/

// START THE SERVER
// =============================================================================
app.listen(port);
exports.app = app;
console.log('Magic happens on port ' + port);
