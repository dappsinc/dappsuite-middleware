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

// Attempt to connect and execute queries if connection goes through
connection.on('connect', function(err)
   {
     if (err)
       {
          console.log(err)
       }
    else
       {
           queryDatabase()
       }
   }
 );

// Query Database for OrgId and Public Address

function queryDatabase()
   { console.log('Reading rows from the Table...');

       // Read all rows from table
     request = new Request(
       "SELECT * FROM [KeyTable];",
          //"SELECT TOP 20 pc.Name as CategoryName, p.name as ProductName FROM [SalesLT].[ProductCategory] pc JOIN [SalesLT].[Product] p ON pc.productcategoryid = p.productcategoryid",
             function(err, rowCount, rows)
                {
                    console.log(rowCount + ' row(s) returned');
                    process.exit();
                }
            );

     request.on('row', function(columns) {
        columns.forEach(function(column) {
            console.log("%s\t%s", column.metadata.colName, column.value);
         });
             });
     connection.execSql(request);
   }
