var utilService = require('./util-service.js');
//var scopeWallet = utilService.getWalletFromPrivKeyFile('{"address":"2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab","crypto":{"cipher":"aes-128-ctr","ciphertext":"58e5e189bdd0206efb10726aadd784d8c466ed6f6723bfd96f3b78262f3d44bc","cipherparams":{"iv":"d0e5441d8649466bae602feea8ce2eda"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"839af0b337cf2eeae6311a544d7ebed02e44ee1e821d77c733fdc497dae873b8"},"mac":"fc660260202cc76af6248e880ff3b99d8dc3b393cda32dac0a58764abbd0ce01"},"id":"cdbfdb6a-539d-4b2a-93b6-4ab3955edf1d","version":3}',"qwertyuiop");
//var scopeWallet = utilService.getWalletFromPrivKeyFile('{"address":"0xa14fbaa70d59e7be1a3e3faf3d405cd333986fb7","crypto":{"cipher":"aes-128-ctr","ciphertext":"91eedbed10df5d67fe11ff9aafd3ffade8e4b4dbbce26d2071f6d3e06925e71a","cipherparams":{"iv":"da5b0289ca3f662254d3c020753c3309"},"mac":"03d77195c36aa9f38dba9eae09c25577830fcc84a974cb73563481dfb695da1c","kdf":"pbkdf2","kdfparams":{"c":262144,"dklen":32,"prf":"hmac-sha256","salt":"6d19d6c234e5c05b1ea6d0a57b434c8e2d5fa336dff4f18ca5120d5f2f9bb753"}},"id":"ac565a39-1ffd-43f3-b7a1-d957734ee301","version":3}',"qwertyuiop");
//console.log(scopeWallet);
var params = {};
params.signUsingOption = 'E';
params.isRegistered = false;
params.accountId = '';
params.ethereumPassword = '';
params.accountJson = '';
var pkPromise = utilService.getPrivateKey(
	params
);
pkPromise.then(function(result){
	console.log(result);
});