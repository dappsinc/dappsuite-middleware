var keythereum = require("keythereum");

// asynchronous
keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
  // do stuff!
});



keythereum.exportToFile(keyObject);

//After successful key export, you will see a message like:

//Saved to file:
//keystore/UTC--2015-08-11T06:13:53.359Z--008aeeda4d805471df9b2a5b0f38a0c3bcba786b

//To use with geth, copy this file to your Ethereum keystore folder

//(usually ~/.ethereum/keystore).