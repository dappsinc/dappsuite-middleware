var web3ApiModule = function(){ 
var self = this;
/*
String constants 
*/
var PROVIDER_URL = 'https://ropsten.infura.io/v3/3a1d742cd66d43e1ab09e3af56012769';
var ETH_TX_PATH = '../node_modules/ethereumjs-tx/index.js';

var Web3 = require('web3');
var solc = require('solc');


//ethereumjs-tx liabrary
var Transaction = require(ETH_TX_PATH);

 if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));
}

var eth = web3.eth;
self.eth = eth;
self.solc = solc;
self.web3 = web3;
self.accounts = eth.accounts;


 self.commonCallback = function(error,result){
    console.info('error:',error);
    console.info('result:',result);
}

self.checkCallbackFn = function(callbackFn){
    if(callbackFn)
        return callbackFn;
    else 
        return self.commonCallback;
}

self.getBalance = function(account,callbackFn){
    web3.eth.getBalance(account,self.checkCallbackFn(callbackFn));
}


self.setDefaultAccount = function(account){
    eth.defaultAccount = account;
}


self.send = function(from,to,amt,callbackFn){
   web3.eth.sendTransaction({ from: from, 
                              to: to, 
                              value: amt
                            },
    function(error,result){
        console.info('error:',error);
        console.info('result:',result);
        if(callbackFn)
            callbackFn(error,result);
    }
    );
}

/*
{contractString} - Contract String
{params} - additional params for future

{example}
var testContract = 'contract x { function g() {} }';
compile(testContract);

returns:

{ ':x':
      { 
        assembly: [Object],
        bytecode:'60606040523415600b57fe5b5b60788061001a6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063e2179b8e14603a575bfe5b3415604157fe5b60476049565b005b5b5600a165627a7a72305820de8e8eb1cd4a01a0b4c86e14d814347d0332c12c7103d0c895745da16677f3a00029',
        functionHashes: [Object], //{"g()":"e2179b8e","getVal()":"e1cb0e52","val()":"3c6bb436"}
        gasEstimates: [Object], //{"creation":[71,24000],"external":{"g()":108},"internal":{}}
        interface: '[{"constant":false,"inputs":[],"name":"g","outputs":[],"payable":false,"type":"function"}]',
        metadata: '{"compiler":{"version":"0.4.9+commit.364da425"},"language":"Solidity","output":{"abi":[{"constant":false,"inputs":[],"name":"g","outputs":[],"payable":false,"type":"function"}],"devdoc":{"methods":{}},"userdoc":{"methods":{}}},"settings":{"compilationTarget":{"":"x"},"libraries":{},"optimizer":{"enabled":false,"runs":200},"remappings":[]},"sources":{"":{"keccak256":"0x4dd2749c4a88fc27c25be168efe5ea5918a701d744e337a118d80fe95684bde8","urls":["bzzr://0c70293f54e16566a982872ea56941fa11c827ba532dcba365ac5f486724e502"]}},"version":1}',
        opcodes:'PUSH1 0x60 PUSH1 0x40 MSTORE CALLVALUE ISZERO PUSH1 0xB JUMPI INVALID JUMPDEST JUMPDEST PUSH1 0x78 DUP1 PUSH2 0x1A PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN STOP PUSH1 0x60 PUSH1 0x40 MSTORE PUSH1 0x0 CALLDATALOAD PUSH29 0x100000000000000000000000000000000000000000000000000000000 SWAP1 DIV PUSH4 0xFFFFFFFF AND DUP1 PUSH4 0xE2179B8E EQ PUSH1 0x3A JUMPI JUMPDEST INVALID JUMPDEST CALLVALUE ISZERO PUSH1 0x41 JUMPI INVALID JUMPDEST PUSH1 0x47 PUSH1 0x49 JUMP JUMPDEST STOP JUMPDEST JUMPDEST JUMP STOP LOG1 PUSH6 0x627A7A723058 SHA3 0xde DUP15 DUP15 0xb1 0xcd 0x4a ADD LOG0 0xb4 0xc8 PUSH15 0x14D814347D0332C12C7103D0C89574 0x5d LOG1 PUSH7 0x77F3A000290000 ',
        runtimeBytecode: '60606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063e2179b8e14603a575bfe5b3415604157fe5b60476049565b005b5b5600a165627a7a72305820de8e8eb1cd4a01a0b4c86e14d814347d0332c12c7103d0c895745da16677f3a00029',
        srcmap: '0:30:0:-;;;;;;;;;;;;;;;;',
        srcmapRuntime: '0:30:0:-;;;;;;;;;;;;;;;;;13:15;;;;;;;;;;;;;;:::o' 
    } 
}
*/
// self.compile = function(contractString,params){
//     return self.solc.compile(contractString);
// }

//method for compiling: paramas - type of string to be compiled and source code
self.compile = function(req,callbackFn){
    console.log("IIIIIIIIIIIIIIIIIInn web3 req", req);
    try{
        if(req.type.toLowerCase() == "solidity"){
            return self.eth.compile.solidity(req.sourcecode,self.checkCallbackFn(callbackFn));
        }else  if(req.type.toLowerCase() == "lll"){
            return self.eth.compile.lll(req.sourcecode,self.checkCallbackFn(callbackFn));
        }else  if(req.type.toLowerCase() == "serpent"){
            console.log("####in serpent");
            return self.eth.compile.serpent(req.sourcecode,self.checkCallbackFn(callbackFn));
        }  
    }catch(e){
        console.log("##### catch");
        return e;
    }  
}

/*
To load contract from ABI(interface)
{abi} - ABI(Interface) of compiled contract
return Contract Defination
*/
self.loadContract = function(abi){
    return self.eth.contract(abi);
}


self.parseParamArr = function(paramArr){
    var _argsArr = [];
    if(paramArr!=null && paramArr.length>0){
        for(var i=0;i<paramArr.length;i++){
            _argsArr.push(paramArr[i]);
        }
    }

    if(arguments.length>1){
        for(var j=1;j<arguments.length;j++){
            _argsArr.push(arguments[j]);
        }
    }
    return _argsArr;
}

//{	from: $scope.acc1, data: _data}
/*
To create new instance of contract
{transactionObj} - {    
    from: [account address], 
    data: [Data of compiled contract]
    }
{param} - Input parameter to initial contract contructor
{callbackFn}
*/
self.createContract = function(_contractDef,transactionObj,callbackFn,paramArr){
    //console.log('createContract@transactionObj:',JSON.stringify(transactionObj));
    if(!paramArr){
        _contractDef.new(transactionObj, self.checkCallbackFn(callbackFn));
    }
    else{
        // var _argsArr = [];
        // for(var i=0;i<paramArr.length;i++){
        //     _argsArr.push(paramArr[i]);
        // }
        // _argsArr.push(transactionObj);
        // _argsArr.push(self.checkCallbackFn(callbackFn));
        var _argsArr = self.parseParamArr(paramArr,transactionObj,self.checkCallbackFn(callbackFn));
        console.log('_argsArr@@:'+_argsArr);
        _contractDef.new.apply(_contractDef,_argsArr);
    }
    
}
 
self.call = function(inputParams){
    var _abi = inputParams.abi;
    var _paramArr = inputParams.args;
    var _transactionObj = inputParams.transactionObj;
    var _callback = self.checkCallbackFn(inputParams.callbackFn);
    var _blockNumber = inputParams.blockNumber ? inputParams.blockNumber : 'latest';
    var _address = inputParams.address;
    var _methodName = inputParams.methodName;
 
    var _contractDef = self.loadContract(_abi);
    var _contractInstance = _contractDef.at(_address);
    var _methodInstance = _contractInstance[_methodName];
    var _argsArr = self.parseParamArr(_paramArr,_transactionObj,_callback);
    console.log('_argsArr in call@@:'+_argsArr);
    _methodInstance.call.apply(_methodInstance,_argsArr);
};
 
self.sendTransaction = function(inputParams){
    var _abi = inputParams.abi;
    var _paramArr = inputParams.args;
    var _transactionObj = inputParams.transactionObj;
    var _callback = self.checkCallbackFn(inputParams.callbackFn);
    var _blockNumber = inputParams.blockNumber ? inputParams.blockNumber : 'latest';
    var _address = inputParams.address;
    var _methodName = inputParams.methodName;
 
    var _contractDef = self.loadContract(_abi);
    var _contractInstance = _contractDef.at(_address);
    var _methodInstance = _contractInstance[_methodName];
    var _argsArr = self.parseParamArr(_paramArr,_transactionObj,_callback);
    console.log('_argsArr in call@@:'+_argsArr);
    _methodInstance.sendTransaction.apply(_methodInstance,_argsArr);
};

/*
Get contract at specific address
{contractDef} - Contract definition loaded using ABI, Use method loadContract(abi)
{contractAddress} - Address of deployed contract
return contract instance.
*/
self.getContract = function(contractDef,contractAddr){
    return contractDef.at(contractAddr);
}

/*
Estimate amount of gas required
{transactionObj} - {
        data : [Contract Data]
    }
{callbackFn}
*/
self.estimateGas = function(transactionObj,callbakcFn){
    web3.eth.estimateGas(transactionObj,callbakcFn);
}


/*
To get individual transaction
{transactionId}  - Transaction Id hash
{callbackFn}
*/
self.getTransaction = function(transactionId,callbackFn){
    web3.eth.getTransaction(transactionId,checkCallbackFn(callbackFn));
}
/*
To check transaction is mined or not
{transactionId} - Transaction Id hash
{isRecursive} - Flag which indicate call this method till block is mined
{interval} - interval time for recursive call in miliseconds
{completionCallbackFn} - Callback when transaction is mined
{callbackFn}
*/
self.checkTransaction = function(transactionId,params){
    var isRecursive = params.isRecursive;
    var interval = params.interval;
    var callbackFn = params.callbackFn;
    var completionCallbackFn = params.completionCallbackFn;

    var _callbackFn = function(error,result){
        console.log('checkTransaction with transactionId:%s, result:%s, error:%s',transactionId,result,error);
        if(isRecursive){
            if(result.blockNumber){
                 $timeout(function(){
                    checkTransaction(transactionId,params);}, 
                interval);
            }
            else{
                if(completionCallbackFn)
                    completionCallbackFn(error,result);
            }   
           
        }
        else{
            if(callbackFn){
                callbackFn(error,result);
            }
        }
        
    };

    console.info('checkTransaction with transactionId:%s, isRecursive: %s,interval:%s',transactionId,isRecursive,interval);
    getTransaction(transactionId,_callbackFn);
}

/*
To send raw transaction
{params} - {
    nonce : [Nonce],
    gasPrice: [Gas price],
    gasLimit : [Gas limit],
    value : [Value],
    data : [Data]
    }
{privateKey} - Private key of the account
{callbackFn}

example:
var transactionObj = {
    nonce : 0,
    gasPrice: 100,
    gasLimit : 1000,
    value : 0,
    data : '0x7f4e616d65526567000000000000000000000000000000000000000000000000003057307f4e616d6552656700000000000000000000000000000000000000000000000000573360455760415160566000396000f20036602259604556330e0f600f5933ff33560f601e5960003356576000335700604158600035560f602b590033560f60365960003356573360003557600035335700'
 };

sendRawTransaction(transactionObj,'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',commonCallbackFn);
*/
self.sendRawTransaction = function(params,privateKey,callbackFn){
    var tx = new Transaction(null, 1) // mainnet Tx EIP155

    var _nonce = params.nonce;
    var _gasPrice = params.gasPrice;
    var _gasLimit = params.gasLimit;
    var _value = params.value;
    var _data = params.data;

    tx.nonce = _nonce;
    tx.gasPrice = _gasPrice;
    tx.gasLimit = _gasLimit;
    tx.value = _value;
    tx.data = _data;
    
    var privateKey = new Buffer(privateKey, 'hex')
    tx.sign(privateKey)

    // We have a signed transaction, Now for it to be fully fundable the account that we signed
    // it with needs to have a certain amount of wei in to. To see how much this
    // account needs we can use the getUpfrontCost() method.
    var feeCost = tx.getUpfrontCost()
    tx.gas = feeCost
    console.info('Total Amount of wei needed:' + feeCost.toString())

    // if your wondering how that is caculated it is
    // bytes(data length) * 5
    // + 500 Default transaction fee
    // + gasAmount * gasPrice

    // lets serialize the transaction
    var serializedTx = tx.serialize().toString('hex');
    web3.eth.sendRawTransaction(serializedTx, self.checkCallbackFn(callbackFn));

}


/*Parsing & Validating transactions
If you have a transaction that you want to verify you can parse it. If you got
it directly from the network it will be rlp encoded. You can decode you the rlp
module. After that you should have something like

Note rlp.decode will actully produce an array of buffers `new Transaction` will
take either an array of buffers or an array of hex strings.
So assuming that you were able to parse the tranaction, we will now get the sender's
address

console.log('Senders Address: ' + tx2.getSenderAddress().toString('hex'))

Cool now we know who sent the tx! Lets verfy the signature to make sure it was not
some poser.

if (tx2.verifySignature()) {
  console.log('Signature Checks out!')
}

And hopefully its verified. For the transaction to be totally valid we would
also need to check the account of the sender and see if they have at least
`TotalFee`.

returns Transaction
-getSenderAddress() - return sender address
-verifySignature() - verify signature

example

var rawTx = [
  '0x00',
  '0x09184e72a000',
  '0x2710',
  '0x0000000000000000000000000000000000000000',
  '0x00',
  '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  '0x1c',
  '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
  '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
]

var tx = web3Api.getTransactionFromRaw(rawTx);
tx.getSenderAddress();
tx.verifySignature();


*/

self.getTransactionFromRaw = function(rawTx){
    return new Transaction(rawTx);
}

self.setDefaultAccount(self.accounts[0]);





}

if(module!=undefined && module.exports!=undefined){
    module.exports = web3ApiModule;
}
else{
    window.web3ApiModule = web3ApiModule;   
}
  