var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

// Create connection to database
var config =
   {
     userName: '', // update me ** NEEDS TO BE SET IN VAR
     password: '', // update me ** NEEDS TO BE SET IN VAR
     server: '', // update me ** NEEDS TO BE SET IN VAR
     options:
        { encrypt: true
        }
   }
var connection = new Connection(config);

// instantiate - provide the table where you'll be inserting to, and a callback
var bulkLoad = connection.newBulkLoad('KeyTable', function (error, rowCount) {
  console.log('inserted %d rows', rowCount);
});

// add rows
bulkLoad.addRow({ OrgId: 'x', Address: '1' });


// execute
connection.execBulkLoad(bulkLoad);
console.log('Key inserted');
process.exit();
