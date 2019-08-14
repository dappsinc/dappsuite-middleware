let daoServiceModule = function(){

	let self = this;
	let utilsDaoModule = require("../utils/utilsDao.js");
	let utilsDao = new utilsDaoModule();

	let getModel = function(modelName){
		return db[modelName];
	}
	

	//**************Read OPERATIONS************

	//--------------TokenStore-----------------
	self.createTokenStore = function(values, options){
		let createPromise =  utilsDao.create('TokenStore',values, options);
		return createPromise;
	}

	//------------------------Key---------------------
	self.createOrUpdateKey = function(values, options){
		let createPromise =  utilsDao.create('Key',values, options);
		return createPromise;
	}


	//--------------Org-----------------
	self.createOrg = function(values, options){
		let createPromise =  utilsDao.create('Org',values, options);
		return createPromise;
	}

	self.createOrUpdateOrg = function(values, options){
		let createPromise =  utilsDao.createOrUpdate('Org',values,options);
		return createPromise;
	}

	//**************Read OPERATIONS************

	//--------------TokenStore-----------------
	self.findByIdTokenStore = function(idValue){
		return utilsDao.findById('TokenStore',idValue);
	}
	self.findOneTokenStore = function(options){
		return utilsDao.findOne('TokenStore',options);
	}
	self.findAllTokenStore = function(options){
		return utilsDao.findAll('TokenStore',options);
	}
	self.createOrUpdateTokenStore = function(values, options){
		let createPromise =  utilsDao.createOrUpdate('TokenStore',values,options);
		return createPromise;
	}
	self.findOrCreateTokenStore = function(options){
		return utilsDao.findOrCreate('TokenStore',options);
	}
	self.updateTokenStore = function(values,options){
		let createPromise =  utilsDao.update('TokenStore',values,options);
		return createPromise;
	}

	//------------- Key ---------------
	self.findKeyByAddress = function(_inputAddress){
		return utilsDao.findOne('Key', {where : {address : _inputAddress} }); //, attributes : ['addressDetailsJson']
	}
	

	//--------------Org-----------------
	self.findByIdOrg = function(orgId){
		return utilsDao.findById('Org',orgId);
	}
	self.findAllOrg = function(options){
		return utilsDao.findAll('Org',options);
	}
	self.findOrCreateOrg = function(options){
		return utilsDao.findOrCreate('Org',options);
	}

	//--------------User-----------------
	self.findOneUser = function(options){
		return utilsDao.findOne('User',options);
	}
	self.findAllUser = function(options){
		return utilsDao.findAll('User',options);
	}
	self.findOrCreateUser = function(options){
		return utilsDao.findOrCreate('User',options);
	}
	self.createOrUpdateUser = function(values, options){
		let createPromise =  utilsDao.createOrUpdate('User',values,options);
		return createPromise;
	}
	self.updateUser = function(values,options){
		let createPromise =  utilsDao.update('User',values,options);
		return createPromise;
	}
}

if(module!=undefined && module.exports!=undefined){
    module.exports = daoServiceModule;
}
else{
    window.daoServiceModule = daoServiceModule;   
}
