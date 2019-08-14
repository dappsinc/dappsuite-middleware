var Web3 = require('web3');
var factory = require('./data-factory.json');
var PROVIDER_URL = 'PROVIDER_URL';
var salesforce = require('./salesforce');
var web3=new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));
var web3ApiClass = require('./web3.api.js');
var web3Api = new web3ApiClass();

var filter = web3.eth.filter('latest');
//runFilter();

function runFilter(){
  console.log('###in filter');
  filter.watch(function(error, result) {

    
      console.log('***error***',error);
      console.log('***filter Watch Result : Block Hash ***',result);

      
        var blockHash = result;
        //Second parameter will specify block should contrains transaction object or only hash
        web3.eth.getBlock(blockHash, true,function(error2,result2){
          
          setTimeout(function(){

            var blockObj = result2;
            //console.log('***getBlock Result ***Block Obj:',blockObj);

            var transactionHashToTransactionReceiptMap = {};
            var contractAddressToTransactionMap = {};

            var contractAddressArray = [];
            //checking if there are any transactions in this block
            
            if(blockObj.transactions.length > 0){
              for(i = 0; i < blockObj.transactions.length; i++){
                  console.log('###lockObj.transactions hash', blockObj.transactions[i].hash);
                  var txHash = blockObj.transactions[i].hash;
                  web3Api.getTransactionFull(txHash, function(error, transactionObj){
                    if(transactionObj){
                      contractAddressArray.push(transactionObj.contractAddress);
                      transactionHashToTransactionReceiptMap[txHash] = transactionObj;
                    }
                  });
              }
            }

            setTimeout(function(){

            //query transaction records based on the contract address obtained above in map
            if(contractAddressArray){
              var contractAddress = contractAddressArray;
              console.log('######contractAddress ',contractAddress);

              var contractAddressString = "'" + contractAddress.join("','") + "'";

              if(contractAddress && contractAddress.length > 0){
                  
                  query = 'select id,dapps__Contract_Address_Hash__c,dapps__TxHash__c from dapps__Transactions__c where dapps__Contract_Address_Hash__c IN ('+ contractAddressString +')';
                  console.log('######contractAddress query ',query);

                  //get all transactions record sfrom SF
                  salesforce.getRecordsByQuery(query, function(result){
                  console.log('######contractAddress query result ',result);

                  var transactionsFromSF = result;
                  
                  //getting transaction hashes from SF in a array
                  transactionHashFromSF = []

                  for(i = 0; i < transactionsFromSF.length; i++){                                    
                    transactionHashFromSF.push(transactionsFromSF[i]["_fields"].dapps__txhash__c);
                  }

                  //getting transaction hashes from the block
                  transactionHashFromBlock = Object.keys(transactionHashToTransactionReceiptMap);                

                  //getting transaction hashes which are there in block but not in SF
                  var doNotMatch = [];
                  for(var i=0;i<transactionHashFromBlock.length;i++){
                     if(transactionHashFromSF.indexOf(transactionHashFromBlock[i])==-1){doNotMatch.push(transactionHashFromBlock[i]);}
                  }

                  console.log('#####transactionHashFromSF ',transactionHashFromSF,'#####transactionHashFromBlock ',transactionHashFromBlock,'#####doNotMatch ',doNotMatch);

                  //insert transactions done outside from SF
                  if(doNotMatch && doNotMatch.length > 0){
                    for(i = 0; i < doNotMatch.length; i++){
                      console.log("####doNotMatch ", doNotMatch[i], transactionHashToTransactionReceiptMap);

                      var txHash = doNotMatch[i];
                      
                      setTimeout(function(){
                          console.log('##### in outside sf insert');
                          salesforce.insertSObject('dapps__Transactions__c', convertToTransactionSObject(transactionHashToTransactionReceiptMap[txHash]));
                      },3000);
                    }
                  }


                });  
              }            
            }

            },5000);


          },5000);

        });     

  });

}



function convertToTransactionSObject(transactionObj){
  //console.log("####transactionObj ", transactionObj);
  return [
    { name : 'Name', value : 'Outside of SF - Transaction'},    
    { name : 'dapps__TxHash__c', value : transactionObj.transactionHash},
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

//function for creating map with contract address as key and value as array of transactions
function addValueToMap(map, key, value) {
    //if the list is already created for the "key", then uses it
    //else creates new list for the "key" to store multiple values in it.
    map[key] = map[key] || [];
    map[key].push(value);
}

exports.runFilter = runFilter;
/*


0xac1547e7b8acb7715d73e38a8ba3a8144161618c066286539213117086904562



Block Obj: { number: 2,
  hash: '0xec79fd63b9fd1c8dd8c3af617f32e374a74b572be50976328e45c60da1758852',
  parentHash: '0xce39e4e3824e2a6aceb933104566b6f51cb3c0af6a107eca1c097ece497b68e8',
  nonce: '0x0',
  sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
  logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  stateRoot: '0x976dcf9e9e3a8e348375339dcc414680c149adf878cc46bbd06190ddc414c772',
  receiptRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
  miner: '0x0000000000000000000000000000000000000000',
  difficulty: { [String: '0'] s: 1, e: 0, c: [ 0 ] },
  totalDifficulty: { [String: '0'] s: 1, e: 0, c: [ 0 ] },
  extraData: '0x0',
  size: 1000,
  gasLimit: 4712388,
  gasUsed: 26794,
  timestamp: 1493445459,
  transactions: 
   [ { hash: '0x5817737f91a31a35bbbd213a773ee74b58245c66935b01f634070636646becaf',
       nonce: 1,
       blockHash: '0xec79fd63b9fd1c8dd8c3af617f32e374a74b572be50976328e45c60da1758852',
       blockNumber: 2,
       transactionIndex: 0,
       from: '0x16d3aadaadf6d032ed6f525ee052ed2ab59984e0',
       to: '0xae312ed39fea55e0fc67947185c83c6e83bd8305',
       value: [Object],
       gas: 90000,
       gasPrice: [Object],
       input: '0xce29371b0000000000000000000000000000000000000000000000000000000000000015' } ],
  uncles: [] }


  //sample query testing
  [ '0x54d2f90845e0568b91149cab73f530dc4f3cf268' ]
######contractAddress query  select id,dapps__Contract_Address_Hash__c,dapps__TxHash__c from dapps__Transactions__c where dapps__Contract_Address_Hash__c IN 0x54d2f90845e0568b91149cab73f530dc4f3cf268

*/

