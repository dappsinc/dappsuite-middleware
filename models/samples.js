let db = require("./db");
const config = require("../config/config");
let SequelizeAuto = require('sequelize-auto');


//sample search and insert to insert data

var searchToken = function(){  new Promise(function (resolve, reject) {
    db
        .TokenStore
        .findOne({
            where: {
                userId: '1',
                orgId: '1'                    
            }
        })
        .then((value) => console.log("####find result", value))
})};
searchToken();

var insertToken = function(){  new Promise(function (resolve, reject) {
    db
        .TokenStore
            .create({
                userId: 1,
                orgId: 1,                        
                accessToken: 1,
                refreshToken: 1,        
                
            })    
            .then(function (values) {
                console.log("#####inserted values", values);
                resolve(values);
            })
})};

//insertToken();



// var auto = new SequelizeAuto(config.DB_DATABASE,
//     config.DB_USERNAME,
//     config.DB_PASSWORD,
//     {dialect: "mssql", host: config.DB_SERVER, dialectOptions: {encrypt: config.DB_ENCRYPT}, 
//         additional: {timestamps: true, createdAt: true}}
// );


// auto.run(function (err) {
//   if (err) throw err;

//   console.log(auto.tables); // table list
//   //console.log(auto.foreignKeys); // foreign key list
// });


