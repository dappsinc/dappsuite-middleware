var ethUtil = require('ethereumjs-util');
ethUtil.crypto = require('crypto');
ethUtil.Tx = require('ethereumjs-tx');
keythereum = require("keythereum");
Web3 = require('web3');

web3.sha3(PASSWORD);

var hexToBytes = function(hex) {
  for (var bytes = [], c = 0; c< hex.length; c +=2)
  bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

var privateKeyToAddress = function(privteKey) {
  return `0x${EthUtil.privateKeyToAddress(hexToBytes(privateKey)).toString('hex')}`
}
