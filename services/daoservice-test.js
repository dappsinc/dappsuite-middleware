let utilsDaoModule = require('../utils/utilsDao.js');
let daoUtils = new utilsDaoModule();
let daoServiceModule = require('./daoservice.js');
let daoService = new daoServiceModule();

daoUtils.findAll('Org').then(function(valueOne){
	console.log('***valueOne org:', valueOne);
});