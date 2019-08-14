var web3ApiClass = require('./web3.api.js');
var web3Api = new web3ApiClass();
var factory = require('./data-factory.json');

//Assignment
var PROVIDER_URL = factory.TEST_NET_URL;
var CURRENT_ACCOUNT = factory.TEST_NET_ACCOUNT_1.ID;
var CURRENT_PRIVATE_KEY = factory.TEST_NET_ACCOUNT_1.DEC_KEY;
var byteData = factory.contracts.MyContract.DATA;
var MyContract = web3Api.loadContract(factory.contracts.MyContract.ABI);

var contractNewData = MyContract.new.getData(1,5,{data : byteData, from : CURRENT_ACCOUNT});
var createTransaction = {
	data : contractNewData
 };
web3Api.sendRawTransaction(createTransaction,CURRENT_PRIVATE_KEY,function(error,transactionHash){
	console.log('***MyContract mc = new MyContract(1,5);');
	console.log('Transaction created with transaction hash:', transactionHash);
	console.log('waiting to be mined...');
	web3Api.checkTransaction(transactionHash,{
		isRecursive : true,
		interval : 1000,
		completionCallbackFn : function(error,transactionObj){
			var contractAddress = transactionObj.contractAddress;
			console.log('Contract Created at Address: ',contractAddress);
			var number2 = MyContract.at(contractAddress).getNumber2.call();
			console.log('***mc.getNumber2()=',number2);
			console.log('calling method mc.setNumber(27)...');
			var sendTransactionData = web3Api.getContract(MyContract,contractAddress).setNumber2.getData(27,{data : byteData, from : CURRENT_ACCOUNT});
			var sendTransactionObj = {
				data : sendTransactionData,
				to : contractAddress
			 };
			 web3Api.sendRawTransaction(sendTransactionObj,CURRENT_PRIVATE_KEY,function(error,transactionHash){
				console.log('Transaction created with transaction ID:',transactionHash);
				console.log('waiting to be mined...');
			 	web3Api.checkTransaction(transactionHash,{
					isRecursive : true,
					interval : 1000,
					completionCallbackFn : function(error,transactionObj){
						var number2 = MyContract.at(contractAddress).getNumber2.call();
						console.log('Transaction:'+transactionHash+' is mined.');
						console.log('***mc.getNumber2() =',number2);
					}});
			 });

		}
	});
});
