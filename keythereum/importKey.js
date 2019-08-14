var keythereum = require("keythereum");


// Specify a data directory (optional; defaults to ~/.ethereum)
var datadir = "";
// this has to be provider/dappsai/.ethereum-test etc

// Synchronous
var keyObject = keythereum.importFromFile(address, datadir);

// Asynchronous
keythereum.importFromFile(address, datadir, function (keyObject) {
  // do stuff
});


// synchronous
var privateKey = keythereum.recover(password, keyObject);
// privateKey:
<Buffer ...>

// Asynchronous
keythereum.recover(password, keyObject, function (privateKey) {
  // do stuff
});