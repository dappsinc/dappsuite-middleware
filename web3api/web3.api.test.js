var web3ApiClass = require('../web3.api.js');
var web3Api = new web3ApiClass();

 web3Api.getBalance('0xa3d4bd62678fb486a49ff66a3fae049a2fd87379', function(error,result){
    console.log('balance:'+result);
 });