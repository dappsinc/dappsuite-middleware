# DappSuite - Salesforce Ethereum Middleware

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/dappsinc/dappsuite-middleware/src)


1. Create a new Connected App and set the variables in config vars:

```jsx 

var SF_UNAME 		= process.env.SF_UNAME; // set salesforce username
var SF_PWD 			= process.env.SF_PWD; // ser salesforce password
var CLIENT_ID 		= process.env.CLIENT_ID; // set connected app id
var CLIENT_SECRET 	= process.env.CLIENT_SECRET; // set connected app secret
var CALLBACK_URI	= 'http://localhost:3000/oauth/_callback';

```
