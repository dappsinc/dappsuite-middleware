var web3ApiModule = function(){ 
var self = this;

var PROVIDER_URL = ''; // Set Provider URL

var ETH_TX_PATH = './node_modules/ethereumjs-tx/index.js';

var Web3 = require('web3');
var solc = require('solc');
var Transaction = require(ETH_TX_PATH);

 if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));
}

console.log("#####web3", web3.currentProvider)

var eth = web3.eth;
self.eth = eth;
self.solc = solc;
self.web3 = web3;

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

self.getBalanceSync = function(address,unit){
    let weiBal;
    try{
        weiBal= web3.eth.getBalance(address);
    }
    catch(e){
        console.log("#####error", e)
        return parseFloat('0');
    }
     
    let bal;
    if(!unit || unit!='wei'){
        if(weiBal){
            weiBal = web3.fromWei(weiBal,unit);
        }

    }
    let floatBal = parseFloat(weiBal);
    return floatBal;
}

//console.log(web3.eth.getBalance("0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab"));

/*
To get and resolve an ENS address
{address} - address
i.e. setDefaultAccount(accounts[0]);
*/

self.getAddress = function(address){
    eth.ens.getAddress(ENSName).then(function (address) {
        
    })
    return address;
}

/*
To set default account
{account} - account address
i.e. setDefaultAccount(accounts[0]);
*/

self.setDefaultAccount = function(account){
    eth.defaultAccount = account;
}

/*
To send amount from one account to another
{from} - From address
{to} - To address
{amt} - Amount
{callBackFn} - Call back function like function(error,result){ // }
*/
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

//method for compiling: paramas - type of string to be compiled and source code and this will return solc objec so that it can be used for compiling
self.compile = function(req,callbackFn){
    //console.log("IIIIIIIIIIIIIIIIIInn web3 req", req);
    try{
        if(req.version){
            console.log("in version", req.version);
            // getting the development snapshot
            solc.loadRemoteVersion(req.version, callbackFn);
        }else{
            console.log("######## in local version");            
            callbackFn('no error in solc', solc);
        }        

    }catch(e){
        console.log("##### catch", e);
        return e;
    }  
}

self.returnSolc = function(solc,callbackFn){
    callbackFn('',solc);
};


//method for getting current local solidity version
/*
self.getCurrentSolidityVersion = function(req,callbackFn){    
    try{
        var solidityVersion = solc.version();

        return 

    }catch(e){
        console.log("##### catch");
        return e;
    }  
}
*/

/*
To load contract from ABI(interface)
{abi} - ABI(Interface) of compiled contract
return Contract Defination
*/
self.loadContract = function(abi){
    console.log("######in loadContract");
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

//{ from: $scope.acc1, data: _data}
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

self.createContractNew = function(contractDef,contractNewData,privateKey,callbackImpl,callBackFnWithContractInstance,paramArr){
    console.log("#####in createContractNew");
    var sendTransactionNewData;
    if(!paramArr){
        sendTransactionNewData = contractDef.new.getData(contractNewData);    
    }
    else{
        var _argsArr = self.parseParamArr(paramArr,contractNewData);
        //console.log("###create contract new: _argsArr : ", _argsArr);
        sendTransactionNewData = contractDef.new.getData.apply(contractDef.new,_argsArr);
    }
    console.log('***contractDef.new.getData***',contractDef.new.getData);
    //console.log('***contractNewData***',contractNewData);
    //console.log('***sendTransactionNewData***',sendTransactionNewData);
    self.sendRawTransaction({data : sendTransactionNewData, from : contractNewData.from},privateKey,function(error,transactionHash){
        if(error){
            console.log('***create error***',error);
        }
        console.log('Transaction created with transaction hash:', transactionHash);
        console.log('waiting to be mined...');

        //getTransactionReceipt(transactionHash, function(error, initTransactionObj){
        callbackImpl(error,transactionHash);
        //});

        var completionCallbackFnImpl = function(error,transactionObj){
            if(!error){
                var contractAddress = transactionObj.contractAddress;
                console.log('Contract Created at Address: ',contractAddress);
                var contractInstance = self.getContract(contractDef,contractAddress);

                if(callBackFnWithContractInstance)
                    callBackFnWithContractInstance(contractAddress,contractInstance,transactionObj);
            }
            else{
                console.error("**afterContractFn:error***",error);
            }
        }
        if(transactionHash){
            self.checkTransaction(transactionHash,{
                isRecursive : true,
                interval : 1000,
                completionCallbackFn : completionCallbackFnImpl
            });
        }
        
    });
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

// self.sendTransactionNew = function(sendTransactionData,contractAddress,privateKey,completionCallbackFnImpl){
// var sendTransactionObj = {
//     data : sendTransactionData,
//     to : contractAddress,
//     value : 1000000000
//  };
//  self.sendRawTransaction(sendTransactionObj,privateKey,function(error,transactionHash){
//     console.log('Transaction created with transaction ID:',transactionHash);
//     console.log('waiting to be mined...');
//     self.checkTransaction(transactionHash,{
//         isRecursive : true,
//         interval : 1000,
//         completionCallbackFn :completionCallbackFnImpl
//         });
//  });
// }

self.sendTransactionNew = function(inputParams,callbakcImpl,completionCallbackFnImpl){
var _abi = inputParams.abi;
var _paramArr = inputParams.args;
var _from  = inputParams.from;
var _data  = inputParams.data;
var _callback = self.checkCallbackFn(inputParams.callbackFn);
var _blockNumber = inputParams.blockNumber ? inputParams.blockNumber : 'latest';
var _address = inputParams.address;
var _methodName = inputParams.methodName;
var _privateKey = inputParams.privateKey;

var _contractDef = self.loadContract(_abi);
var _contractInstance = _contractDef.at(_address);
var _methodInstance = _contractInstance[_methodName];
var _argsArr = self.parseParamArr(_paramArr,{data : _data, from : _from});


console.log('_methodInstance',_methodInstance, '_argsArr', _argsArr);

var sendTransactionData = _methodInstance.getData.apply(_methodInstance,_argsArr);
var sendTransactionObj = {
    data : sendTransactionData,
    to : _address,
    from : _from
 };

 self.sendRawTransaction(sendTransactionObj,_privateKey,function(error,transactionHash){
    if(callbakcImpl){
        callbakcImpl(error,transactionHash);
    }

    if(!transactionHash) console.error(error);
    
    console.log('Transaction created with transaction ID:',transactionHash);
    console.log('waiting to be mined...');
    self.checkTransaction(transactionHash,{
        isRecursive : true,
        interval : 1000,
        completionCallbackFn :completionCallbackFnImpl
        });
 });
}


self.transfer = function(inputParams,callbakcImpl,completionCallbackFnImpl){
var _from = inputParams.from;
var _to = inputParams.to;
var _value  = inputParams.value;
var _privateKey = inputParams.privateKey;

var sendTransactionObj = {
    value : _value,
    to : _to,
    from : _from
 };

 self.sendRawTransactionForTransfer(sendTransactionObj,_privateKey,function(error,transactionHash){
    if(callbakcImpl){
        callbakcImpl(error,transactionHash);
    }

    if(!transactionHash) console.error(error);
    
    console.log('Transaction created with transaction ID:',transactionHash);
    console.log('waiting to be mined...');
    self.checkTransaction(transactionHash,{
        isRecursive : true,
        interval : 1000,
        completionCallbackFn :completionCallbackFnImpl
        });
 });
}
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
****getTransaction*** { blockHash: '0x066363ddb741d88859de31bb786a4e3e210ff3d2493736c29a72a04b80a1e9a9',
  blockNumber: 46990,
  contractAddress: '0xee3c3e7ad11aa602d6f48b4ccd40392809a62104',
  cumulativeGasUsed: 132763,
  from: '0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab',
  gasUsed: 132763,
  logs: [],
  logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  root: '0x07dfddeaa4d6330fbd5dcff9e04ca34b26a9622edc625a202bf3e45635c81992',
  to: null,
  transactionHash: '0xc81355f8c486382698cc011f71d911bcca90d30fdc0658d478807d5071598530',
  transactionIndex: 0 }
****getTransaction2*** { blockHash: '0x066363ddb741d88859de31bb786a4e3e210ff3d2493736c29a72a04b80a1e9a9',
  blockNumber: 46990,
  from: '0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab',
  gas: 3000000,
  gasPrice: { [String: '20000000000'] s: 1, e: 10, c: [ 20000000000 ] },
  hash: '0xc81355f8c486382698cc011f71d911bcca90d30fdc0658d478807d5071598530',
  input: '0x6060604052604051602080610113833981016040528080519060200190919050505b806000600050819055505b5060d98061003a6000396000f360606040526000357c010000000000000000000000000000000000000000000000000000000090048063271f88b414604d578063aa8c217c146067578063d321fe2914608c576049565b6002565b346002576065600480803590602001909190505060b1565b005b346002576076600480505060bf565b6040518082815260200191505060405180910390f35b34600257609b600480505060c8565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b60006000505481565b6000600060005054905060d6565b90560000000000000000000000000000000000000000000000000000000000000003',
  nonce: 108,
  to: null,
  transactionIndex: 0,
  value: { [String: '0'] s: 1, e: 0, c: [ 0 ] },
  v: '0x1c',
  r: '0xd8a20821e1d6d972eaac6f7dd47e21ec62df63687ba412ed0e4ea1caa4bdbf6e',
  s: '0x345a7744f09bdb5972c1a57e7df9d9b70d5137e0945b4c2daf22ab542ea66d57' }

*/

self.getTransactionFull = function(transactionId,callbackFn){
    transactionId = ''+transactionId;
    web3.eth.getTransactionReceipt(transactionId, function(error1, transactionObj1){
        if(error1){
            callbackFn(error1,undefined);
        }
        else{
           
            if(!(transactionObj1.contractAddress))
                transactionObj1.contractAddress = transactionObj1.to;
            web3.eth.getTransaction(transactionId, function(error2, transactionObj2){
            if(error2){
                callbackFn(error2,undefined);
            }
            else{
                transactionObj1.gas = transactionObj2.gas;
                transactionObj1.gasPrice = transactionObj2.gasPrice;
                transactionObj1.input = transactionObj2.input;
                transactionObj1.nonce = transactionObj2.nonce;
                transactionObj1.value = transactionObj2.value;
                transactionObj1.v = transactionObj2.v;
                transactionObj1.r = transactionObj2.r;
                transactionObj1.s = transactionObj2.s;

                callbackFn(undefined,transactionObj1);
            }
        });
        }
    });

}
self.getTransaction = function(transactionId,callbackFn){
    web3.eth.getTransactionReceipt(transactionId,self.checkCallbackFn(callbackFn));
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
        //console.log('checkTransaction with transactionId:%s, result:%s, error:%s',transactionId,result,error);
        if(isRecursive){
            if(!result || !result.blockNumber){
                 setTimeout(function(){
                    self.checkTransaction(transactionId,params);}, 
                interval);                 
            }
            else{                
                if(completionCallbackFn){                   
                    self.getTransactionFull(transactionId, function(errorC, resultC){
                        completionCallbackFn(errorC,resultC);
                    });
                }
            }   
           
        }
        else{
            if(callbackFn){
                callbackFn(error,result);
            }
        }
        
    };

   // console.info('checkTransaction with transactionId:%s, isRecursive: %s,interval:%s',transactionId,isRecursive,interval);
    self.getTransaction(transactionId,_callbackFn);
}

self.sendRawTransaction = function(params,privateKey,callbackFn){

    const gasPrice = params.gasPrice?params.gasPrice : web3.eth.gasPrice;
    const gasPriceHex = web3.toHex(gasPrice);
    const gasLimit = params.gasLimit?params.gasLimit : 3000000;
    const gasLimitHex = web3.toHex(gasLimit);
    const from = params.from?params.from : web3.eth.coinbase;
    const nonce = web3.eth.getTransactionCount(from);
    const nonceHex = web3.toHex(nonce);    
    const data = (params.data && params.data.startsWith('0x')?'':'0x')+params.data;
    const to = params.to ? params.to :'';
    console.log('from in sendRawTransaction:',from);

    const rawTx = {
        nonce: nonceHex,
        gasPrice: gasPriceHex,
        gasLimit: gasLimitHex,
        data: data,
        from:from,
        to : to
    };

    const tx = new Transaction(rawTx);
    var privateKeyHex = new Buffer(privateKey, 'hex')
    tx.sign(privateKeyHex);
    var feeCost = tx.getUpfrontCost();
    //console.info('Total Amount of wei needed:' + feeCost.toString());
    const serializedTxHex = '0x'+tx.serialize().toString('hex');
    web3.eth.sendRawTransaction(serializedTxHex, callbackFn);
}

self.sendRawTransactionForTransfer = function(params,privateKey,callbackFn){

    const gasPrice = params.gasPrice?params.gasPrice : web3.eth.gasPrice;
    const gasPriceHex = web3.toHex(gasPrice);
    const gasLimit = params.gasLimit?params.gasLimit : 3000000;
    const gasLimitHex = web3.toHex(gasLimit);
    const from = params.from?params.from : web3.eth.coinbase;
    const nonce = web3.eth.getTransactionCount(from);
    const nonceHex = web3.toHex(nonce);    
    const data = (params.data && params.data.startsWith('0x')?'':'0x')+params.data;
    const to = params.to ? params.to :'';
    let value = params.value;
    console.log('from in sendRawTransaction:',from);

    const rawTx = {
        nonce: nonceHex,
        gasPrice: gasPriceHex,
        gasLimit: gasLimitHex,
        data: data,
        from:from,
        to : to,
        value : value
    };

    const tx = new Transaction(rawTx);
    var privateKeyHex = new Buffer(privateKey, 'hex')
    tx.sign(privateKeyHex);
    var feeCost = tx.getUpfrontCost();
    //console.info('Total Amount of wei needed:' + feeCost.toString());
    const serializedTxHex = '0x'+tx.serialize().toString('hex');
    web3.eth.sendRawTransaction(serializedTxHex, callbackFn);
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

// self.getTransactionFromRaw = function(rawTx){
//     return new Transaction(rawTx);
// }

//self.setDefaultAccount(self.accounts[0]);





}

if(module!=undefined && module.exports!=undefined){
    module.exports = web3ApiModule;
}
else{
    window.web3ApiModule = web3ApiModule;   
}
  
