var nforce 			= require('nforce');
var http			= require('http');

var SF_UNAME 		= process.env.SF_UNAME; // set salesforce username
var SF_PWD 			= process.env.SF_PWD; // set salesforce password
var CLIENT_ID 		= process.env.CLIENT_ID; 
var CLIENT_SECRET 	= process.env.CLIENT_SECRET; // set connected app secret
var CALLBACK_URI	= process.env.CALLBACK_URI;

var oauth;
var oauthJSONString='';

var org;

function login(callback){
	
	org = nforce.createConnection({
	  clientId: CLIENT_ID,
	  clientSecret: CLIENT_SECRET,
	  redirectUri: CALLBACK_URI,
	  autoRefresh: true,
	  apiVersion: 'v36.0',  		// optional, defaults to current salesforce API version
	  environment: 'production',  	// optional, salesforce 'sandbox' or 'production', production default
	  mode: 'single' 				// optional, 'single' or 'multi' user mode, multi default
	});

	org.authenticate({ username: SF_UNAME, password: SF_PWD}, function(err, resp){
	  // store the oauth object for this user
	  if(!err){ 
			oauth = resp;
			oauth = org.oauth;			
			console.log('@@@@ auth');
			console.log(oauth);
			console.log('@@@@ oauthJSONString' + oauthJSONString);
			//session.userData.isLoggedIn = true;
			//session.userData.userURL=oauth.id;
			callback(resp);

		} else {
			console.log('Error: ' + err.message);
			//session.userData.isLoggedIn = false;
			callback(err);
		}
	});
}
function querySObject(query,callback){

	org.query({ query: query,oauth: oauth }, function(err, res) {
	  if(err) return console.error(err);
	  else {
		//console.log(res.records[0]);
		callback(res.records);
		}
	});
}

//general fucntion query records from SF. Pass on the query and callback function
function getRecordsByQuery(query,callback){
	//console.log("###### query",query)

	org.query({ query: query,oauth: oauth }, function(err, res) {
		if(err) {			
			callback(err);
	  	}
		else {		
			callback(res.records);
		}
	});
}

function insertSObject(sObjectType,fieldList) {
	
	var sObject = nforce.createSObject(sObjectType);

	for(var i=0;i<fieldList.length;i++){
    	var field = fieldList[i];
    	sObject.set(field.name, field.value);
	}

	var sPromise = new Promise(function (resolve, reject) {
		org.insert({ sobject: sObject, oauth: oauth }, function (err, resp) {
			console.log('*****insertSObject*** sObjectType:'+sObjectType);
			if(resp)console.log('*****insertSObject*** resp:'+resp.id);
			if(err)console.log('*****insertSObject*** err:'+err);

			if (!err) {
				resolve(resp);
			} else {
				reject(err);
			}
		});
	});

	return sPromise;

}

var updateWithReference = function(sObjectType, referenceName, referenceValue, fieldList, additionalDetails){
	var otherFieldsName = '';
	if(additionalDetails){
		otherFieldsName = ','+additionalDetails.referenceName;
	}
	var query = 'SELECT ID, Name '+otherFieldsName+' FROM '+sObjectType+' WHERE '+referenceName+'=\''+referenceValue + '\'';
	getRecordsByQuery(query,function(records){
	console.log('*****updateWithReference***records:',records);
	console.log('*****updateWithReference***records[0]:',records[0]);
	if(records){
		var fields = records[0]["_fields"];
		console.log('*****updateWithReference***fields:',fields);
		var sObjectId = fields.id;
		console.log('*****updateWithReference***sObjectId:',sObjectId);
		updateWithId(sObjectId, sObjectType ,fieldList);

		if(additionalDetails){
			var otherSObjectType = additionalDetails.sObjectType;
			var otherFields = additionalDetails.fields;
			var otherReferenceName = additionalDetails.referenceName;

			updateWithId(fields[otherReferenceName], otherSObjectType ,otherFields);
		}
	}
	});
}
var updateWithId = function(recordId,sObjectType,fieldList) {

		var sobj = nforce.createSObject(sObjectType);
		sobj.set('id',recordId);
		console.log('#####updateWithId***recordId:',recordId);
		console.log('#####updateWithId***sObjectType:',sObjectType);
		console.log('#####updateWithId***fieldList:',fieldList);
        for(var i=0;i<fieldList.length;i++){
	    	var field = fieldList[i];
	    	 sobj.set(field.name, field.value);
	    }
	    //console.log('#####updateWithId:sobj:',sobj);

       org.update({ sobject: sobj,oauth: oauth }, function(err, resp){
			if(resp)console.log('#####updateWithId***resp:',resp);
			if(err)console.log('#####updateWithId***err:',err);
		});
}

function updateSObject(query) {	

	org.query({ query: query,oauth: oauth }, function(err, resp) {
	  if(err) return console.error(err);

	  if(!err && resp.records) {

		var acc = resp.records[0];
		acc.name = 'Global Media 111';
		
		org.update({ sobject: acc,oauth: oauth }, function(err, resp){
		  if(!err) console.log(acc);
		});

	  } 
	  
  });

}



//pass on the contractObj with address returned along with id

function updateContract(contractObj,result,callback) {

		var contract = nforce.createSObject('dapps__Smart_Contract__c');
		//contract.set('Name', contractObj.name);
        contract.set('dapps__Address__c', contractObj.dapps__Address__c);
        contract.set('id', contractObj.id);	

        //use id a034100000Jsnk7 for testing

       org.update({ sobject: contract,oauth: oauth }, function(err, resp){
		  if(!err) {
			console.log('contract updated');
			console.log(resp);
			contractId = resp.id;
			console.log('contract : ' + contractId);
			callback(contractId,result);
			
		  }
		});
}





// Transaction with address returned along with id

function setTransaction(transactObj,callback) {
	console.log("in sf set trans &&&&& ");
	var transaction = nforce.createSObject('dapps__Transactions__c');
	transaction.set('dapps__Smart_Contract__c', transactObj.Smart_Contract__c);
	transaction.set('dapps__Block__c', transactObj.Block__c);
	transaction.set('dapps__Gas__c', transactObj.Gas__c);
	transaction.set('dapps__Gas_Price__c', transactObj.Gas_Price__c);
	transaction.set('dapps__Gas_Used__c', transactObj.Gas_Used__c);
	transaction.set('dapps__Blockchain__c', transactObj.Blockchain__c);
	//transaction.set('TimeStamp__c', transactObj.TimeStamp__c);
	transaction.set('dapps__TxHash__c', transactObj.TxHash__c);
	transaction.set('dapps__Address__c', transactObj.Address__c);
	transaction.set('Name', 'Eth Txn');

	console.log("#######%%%%%%%%%% ", transaction);


	org.insert({ sobject: transaction, oauth: oauth }, function(err, resp){
		if(!err) {
			console.log('transaction posted');
			transactionId = resp.id;
			callback(transactionId);
		}
	});

}

//create address, need to convert functions to promises later on
// function createAddress(addressObj,callback) {
	
// 	var address = nforce.createSObject('Address__c');
// 	address.set('name', addressObj.name);
// 	address.set('recordTypeId', '01241000000j1fL');
	
// 	console.log("#######%%%%%%%%%% ", transaction);


// 	org.insert({ sobject: address, oauth: oauth }, function(err, resp){
// 		if(!err) {
// 			console.log('address posted');
// 			addressId = resp.id;
// 			callback(addressId);
// 		}else{
// 			console.log("Error has occurred!");
// 		}
// 	});
// }

function savecontracttolibrary(libObj,callback) {
	
	var dapps__Library__c = nforce.createSObject('dapps__Library__c');
	dapps__Library__c.set('Name', libObj.name);
	dapps__Library__c.set('dapps__ABI__c', libObj.dapps__ABI__c);
	dapps__Library__c.set('dapps__Byte_Code__c', libObj.dapps__Byte_Code__c);
	dapps__Library__c.set('dapps__Code__c', libObj.dapps__Code__c);
	dapps__Library__c.set('dapps__Languge__c', libObj.dapps__Languge__c);
	dapps__Library__c.set('dapps__IPFS_Link__c', libObj.dapps__IPFS_Link__c);
	dapps__Library__c.set('dapps__Has_Token__c', libObj.dapps__Has_Token__c);	

	console.log("#######%%%%%%%%%% ", dapps__Library__c);

	org.insert({ sobject: dapps__Library__c, oauth: oauth }, function(err, resp){
		console.log('dapps__Library__c created', resp);				
		callback(err,resp);		
	});

}

// Create Address

function createAddress(addressObj,callback) {
	console.log("in sf set address", addressObj);
	var address = nforce.createSObject('dapps__Address__c');
	address.set('Name', addressObj.name);
	address.set('dapps__Balance__c', addressObj.Balance__c);
	address.set('recordTypeId', '01241000000j1fL');

	if(addressObj.name){
		org.insert({ sobject: address, oauth: oauth }, function(err, resp){
			if(!err) {
				console.log('address posted');
				addressId = resp.id;
				callback(addressId);
			}

		});
	}else{
		callback("Name invalid!");
	}
}


// Create Token

function createToken(data) {
	console.log("in sf set token", data);
	var dapps__Token__c = nforce.createSObject('dapps__Token__c');
	dapps__Token__c.set('Name', data.name);
	dapps__Token__c.set('dapps__Symbol__c', data.dapps__Symbol__c);
	dapps__Token__c.set('dapps__Total_Supply__c', data.dapps__Total_Supply__c);
	dapps__Token__c.set('dapps__Contract_Address__c', data.dapps__Contract_Address__c);
	dapps__Token__c.set('dapps__Type__c', 'ERC20');

	if(data.name){
		org.insert({ sobject: dapps__Token__c, oauth: oauth }, function(err, resp){
			if(!err) {
				console.log('dapps__Token__c posted');				
				//callback(resp.id);
			}else{
				console.log(err);				
			}

		});
	}else{
		//callback("Name invalid!");
	}
}

// Create Contract Record

function createContractRecord(contractObj,callback) {
	console.log("in sf create contract", contractObj);
	var contract = nforce.createSObject('dapps__Smart_Contract__c');
	contract.set('dapps__Address__c', contractObj.Address__c);
	contract.set('dapps__Address2__c', contractObj.Address2__c);
	contract.set('dapps__Status__c', contractObj.Status__c);
    contract.set('Name', contractObj.name);

	
	org.insert({ sobject: contract, oauth: oauth }, function(err, resp){
		if(!err) {
			console.log('address posted');
			addressId = resp.id;
			callback(addressId);
		}else{
			callback(err);
		}

	});

}

// Create Standard Contract Record 

function createStandardContract(standardContract,callback) {
	console.log("create standard contract object", standardContract);
	var contract = nforce.createSObject('Contract');
	contract.set('Name', standardContract.Name);
	contract.set('ContractNumber', standardContract.ContractNumber);
	contract.set('Status', standardContract.Status);

	org.insert({ sobject: contract, oauth: oauth }, function(err, resp){
		if(!err) {
			console.log('Contract Object Created');
			addressId = resp.id;
			callback(addressId);
		}else{
			callback(err);
		}

	});

}

// Baseline Salesforce Record for RFQ Use Case

function baselineContractRecord(baselinedRecord, callback) {

	console.log("create baselined contract object", baselinedRecord);
	var q = `SELECT rfqCaseId from Contract WHERE rfqCaseId = ${baselinedRecord.rfqCaseId} LIMIT 1`;
	
	org.query({ query: q }, function(err, resp){
 
	if(!err && resp.records) {
	   
	var contract = resp.records[0];
	contract.set('rfqCaseId', baselineRecord.rfqCaseId);
	contract.set('purchQty', baselinedRecord.purchQty);
	contract.set('purchUnit', baselinedRecord.purchUnit);
	contract.set('purchPrice', baselineRecord.purchPrice);
	contract.set('lineNum', baselineReocrd.lineNum);
	
    org.update({ sobject: contract, oauth: oauth }, function(err, resp){
		
		if(!err) console.log('Baselined record updated in Salesforce!');
		else {
			return err;
		}
	});

	} else {

	console.log("Create a new Baselined record in Salesforce!")
	var baselinedRecord = nforce.createSObject('Contract')
	baselinedRecord.set('rfqCaseId', baselineRecord.rfqCaseId);
	baselinedRecord.set('purchQty', baselinedRecord.purchQty);
	baselinedRecord.set('purchUnit', baselinedRecord.purchUnit);
	baselinedRecord.set('purchPrice', baselineRecord.purchPrice);
	baselinedRecord.set('lineNum', baselineRecord.lineNum);

	org.insert({ sobject: baselineRecord, oauth: oauth }, function(err, resp){
		if(!err) {
			console.log('Baselined Contract Object Created');
		}else{
			callback(err);
		}
			});
		}
	}
}


//export the functions here
exports.login = login;
exports.baselinedRecord = baselinedRecord;
exports.createContractRecord = createContractRecord;
exports.createStandardContract = createStandardContract;
exports.updateContract = updateContract;
exports.setTransaction = setTransaction;
exports.getRecordsByQuery = getRecordsByQuery;
exports.createAddress = createAddress;
exports.createToken = createToken;
exports.insertSObject = insertSObject;
exports.updateWithReference = updateWithReference;
exports.updateWithId = updateWithId;
exports.savecontracttolibrary = savecontracttolibrary;