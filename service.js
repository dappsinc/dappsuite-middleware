
var salesforce = require('./salesforce');
let salesforceEndpoint = require('./endpoints/salesforce');

function convertToTransactionSObject(transactionObj){
	return [
		{ name : 'dapps__Block__c', value : transactionObj.blockNumber},
		{ name : 'dapps__Contract_Address_Hash__c', value : (transactionObj.contractAddress ? transactionObj.contractAddress : transactionObj.to)},
		{ name : 'dapps__Block_Hash__c', value : transactionObj.blockHash},
		{ name : 'dapps__Gas__c', value : transactionObj.gas},
		{ name : 'dapps__Gas_Price__c', value : transactionObj.gasPrice},
		{ name : 'dapps__Value__c', value : transactionObj.value},
		{ name : 'dapps__Nounce__c', value : transactionObj.nonce},
		{ name : 'dapps__Gas_Used__c', value : transactionObj.gasUsed},
		{ name : 'dapps__Cumulative_Gas_Used__c', value : transactionObj.cumulativeGasUsed}
	]
}
function updateTransaction(sfRefObj,transactionObj,additionalFieldsList,smartContractObj){
	var fields = convertToTransactionSObject(transactionObj);
	if(additionalFieldsList && additionalFieldsList.length > 0){
		for(i=0;i<additionalFieldsList.length;i++){
			fields.push(additionalFieldsList[i]);
		}
	}
	salesforceEndpoint.updateWithReference(
		sfRefObj,
		'dapps__Transactions__c', 
		'dapps__TxHash__c', transactionObj.transactionHash , fields ,smartContractObj
	);
}

module.exports.updateTransaction = updateTransaction;