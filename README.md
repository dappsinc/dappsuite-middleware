# DappSuite - Salesforce Ethereum Middleware

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/dappsinc/dappsuite-middleware/src)


1. Create a new Connected App and set the variables in /config/config.js or using process.env and Configuring Variables:

```jsx 

config.SF_UNAME 		= process.env.SF_UNAME; // set salesforce username
config.SF_PWD 			= process.env.SF_PWD; // ser salesforce password
config.CLIENT_ID 		= process.env.CLIENT_ID; // set connected app id
config.CLIENT_SECRET 	= process.env.CLIENT_SECRET; // set connected app secret
config.CALLBACK_URI	= 'http://localhost:3000/oauth/_callback';
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

```
