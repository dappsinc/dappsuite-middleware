var Web3 = require('web3');
var web;
var web3=new Web3(new Web3.providers.HttpProvider('http://ec2-52-10-60-175.us-west-2.compute.amazonaws.com:8545'));

//['0x422c48810e476f53a7c4eeb2ce87f41b4d51105c','0x670c4ccc3b90a18af775508c2c83f0e85be5acf0', '0x23c491e2b56a340656a92147409b2b67df0a24ab']
//7b1de1d2b9920b543c9786739c9b7595a327b3d956445451e95083b46c081bb4
var ETH_TX_PATH = './node_modules/ethereumjs-tx/index.js';
var Transaction = require(ETH_TX_PATH);
var fn = function(error, result){
	console.log('***fn***error:',error);
	console.log('***fn***error:',result);
}

var ACCOUNT_ID_3 = '0x422c48810e476f53a7c4eeb2ce87f41b4d51105c';
var ACCOUNT_2 = '0x670c4ccc3b90a18af775508c2c83f0e85be5acf0';
var PRIVATE_KEY_3 = '641c4422ce86b518e58fef65571422f310020233002f3ea035917e94618c3629';
web3.eth.defaultAccount = ACCOUNT_ID_3;

var abiArray = [{"constant":false,"inputs":[],"name":"add","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getSum","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"sum","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"number2","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getNumber2","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"getNumber1","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"number1","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_num2","type":"uint256"}],"name":"setNumber2","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"_num1","type":"uint256"},{"name":"_num2","type":"uint256"}],"payable":false,"type":"constructor"}];
var byteData = '6060604052341561000c57fe5b604051604080610271833981016040528080519060200190919080519060200190919050505b81600081905550806001819055505b50505b61021e806100536000396000f3006060604052361561008c576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680634f2be91f1461008e578063569c5f6d146100a0578063853255cc146100c657806390c52443146100ec578063984d0f90146101125780639e911f4c14610138578063c223a39e1461015e578063ce29371b14610184575bfe5b341561009657fe5b61009e6101a4565b005b34156100a857fe5b6100b06101b4565b6040518082815260200191505060405180910390f35b34156100ce57fe5b6100d66101bf565b6040518082815260200191505060405180910390f35b34156100f457fe5b6100fc6101c5565b6040518082815260200191505060405180910390f35b341561011a57fe5b6101226101cb565b6040518082815260200191505060405180910390f35b341561014057fe5b6101486101d6565b6040518082815260200191505060405180910390f35b341561016657fe5b61016e6101e1565b6040518082815260200191505060405180910390f35b341561018c57fe5b6101a260048080359060200190919050506101e7565b005b600154600054016002819055505b565b600060025490505b90565b60025481565b60015481565b600060015490505b90565b600060005490505b90565b60005481565b806001819055505b505600a165627a7a723058200482f6e4cbdad0feb0cc2e3d5277c96e2108609e877a26901ed81d04a455ebab0029';
var MyContract = web3.eth.contract(abiArray);
var contractObjNew = MyContract.at('0x34924bd654360c5dddf9aec29c218276b2075626');
//contractObjNew.setNumber2.sendTransaction(21,fn);
var tempData = contractObjNew.setNumber2.getData(25,{data : byteData, from:ACCOUNT_ID_3});
console.log('***contractObjNew.setNumber2.tempData****',tempData);

var contractData = MyContract.new.getData(1,2,{data : byteData, from:ACCOUNT_ID_3});
//var contractObj = MyContract.new(1,3,{data :byteData,gas : 1000000 ,from:ACCOUNT_ID_3}, fn);
console.log('***defaultAccount***',web3.eth.defaultAccount);
//console.log('***contractObj****',contractObj);
console.log('***contractData****',contractData);



var sendRawTransaction = function(params,privateKey,callbackFn){
    //var tx = new Transaction(null, 1) // mainnet Tx EIP155

   
//    tx.gas = 200000;
    var tx = new Transaction(params);
    var privateKey = new Buffer(privateKey, 'hex')
    console.log('***tx before Sign***',tx);
    tx.sign(privateKey)
    console.log('***tx.getSenderAddress()***',tx);
    console.log('***tx.from()***',tx.from.toString());
    // We have a signed transaction, Now for it to be fully fundable the account that we signed
    // it with needs to have a certain amount of wei in to. To see how much this
    // account needs we can use the getUpfrontCost() method.
    var feeCost = tx.getUpfrontCost()
    tx.gas = 21000;
    console.info('Total Amount of wei needed:' + feeCost.toString())

    // if your wondering how that is caculated it is
    // bytes(data length) * 5
    // + 500 Default transaction fee
    // + gasAmount * gasPrice

    // lets serialize the transaction
    
    var serializedTx = tx.serialize().toString('hex');
	console.log('***sendRawTransaction1***serializedTx:',serializedTx);
    web3.eth.sendRawTransaction('0x'+serializedTx, callbackFn);
}

var transactionObj = {
   nonce: web3.toHex(web3.eth.getTransactionCount(ACCOUNT_ID_3)),
  gasPrice: web3.toHex(20000000), 
  gasLimit: web3.toHex(4712388),
  to: ACCOUNT_2, 
  value: web3.toHex('1000'),
  data : ''
 };

web3.eth.getBalance(ACCOUNT_ID_3,function(error, result){
	console.log('***getBalance***error:',error);
	console.log('***getBalance***result:',result.toString(10));
});
sendRawTransaction(transactionObj,PRIVATE_KEY_3,function(error, result){
	console.log('***sendRawTransaction2***error:',error);
	console.log('***sendRawTransaction2***error:',result);
});

