//let salesforceEndpoint = require('../endpoints/salesforce');

let config = {
    "production": {
        "username": "",
        "password": "",
        "database": "",
        "host": "",
        "dialect": "mssql"
      },
      "development": {
        "username": "",
        "password": "",
        "database": "",
        "host": "",
        "dialect": "mssql"
      }
};

//Salesforce connected app
config.SF_CLIENT_ID = process.env.CLIENT_ID;
config.SF_CLIENT_PWD = process.env.CLIENT_SECRET;
config.SF_CALLBACK_URI = 'https://localhost:3000/oauth/callback';
config.SF_API_VERSION = 'v40.0';

config.ON_REFRESH = function(newOauth, oldOauth, cb){

    console.log("######onRefresh General", newOauth, oldOauth);    
    let utilsOauth = require("../utils/utilsOauth");
    utilsOauth.updateTokenStoreBasedOnAccessToken(newOauth, oldOauth);
    cb(); 
}

//nforce connection options
config.SF_ORG_PRODUCTION = {
        clientId: config.SF_CLIENT_ID,
        clientSecret: config.SF_CLIENT_PWD,
        redirectUri: config.SF_CALLBACK_URI,
        apiVersion: config.SF_API_VERSION,
        environment: "production",
        mode: "multi",
        autoRefresh: true,
        onRefresh: config.ON_REFRESH
    };

config.SF_ORG_SANDBOX = {
        clientId: config.SF_CLIENT_ID,
        clientSecret: config.SF_CLIENT_PWD,
        redirectUri: config.SF_CALLBACK_URI,
        apiVersion: config.SF_API_VERSION,
        environment: "sandbox",
        mode: "multi",
        autoRefresh: true,
        onRefresh: config.ON_REFRESH
    };

//Dapps database settings
config.DB_USERNAME = process.env.SQL_UNAME;
config.DB_PASSWORD = process.env.SQL_PWD;
config.DB_SERVER = process.env.SQL_SERVER;
config.DB_DATABASE = process.env.DATABASE_URL;
config.DB_ENCRYPT = true;

//Node Server setting
config.PORT = 8080;

//Eth setting
config.PROVIDER_URL_MAINNET = process.env.PROVIDER_URL_MAINNET;
config.PROVIDER_URL_TESTNET = process.env.PROVIDER_URL_TESTNET;



module.exports = config;