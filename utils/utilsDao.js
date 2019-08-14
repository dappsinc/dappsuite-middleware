let utilsDaoModule = function(){

	let self = this;
	let db = require("../models/db");

	let getModel = function(modelName){
		return db[modelName];
	}

	let getPrimaryKeyAttributeName = function(modelName){
		let model = getModel(modelName);
		let primaryKeys = model.primaryKeyAttributes;
		if(primaryKeys && primaryKeys.length > 0 ){
			return primaryKeys[0];
		}
		return '';
	}
	//**************CREATE OPERATIONS************
	//Return Promise<Model>
	self.create = function(modelName, modelObject, options){
		let createPromise =  
				getModel(modelName)
                    .create(modelObject, options);
        return createPromise;
	}
	  /*
	   * @param  {Boolean}      [options.validate=true] Run validations before the row is inserted
	   * @param  {Array}        [options.fields=Object.keys(this.attributes)] The fields to insert / update. Defaults to all changed fields
	   * @param  {Boolean}      [options.hooks=true]  Run before / after upsert hooks?
	   * @param  {Transaction}  [options.transaction] Transaction to run query under
	   * @param  {Function}     [options.logging=false] A function that gets executed while running the query to log the sql.
	   * @param  {Boolean}      [options.benchmark=false] Pass query execution time in milliseconds as second argument to logging function (options.logging).
	   * @param  {String}       [options.searchPath=DEFAULT] An optional parameter to specify the schema search_path (Postgres only)
	   *
	   * @return {Promise<created>} Returns a boolean indicating whether the row was created or updated.
	  */
	self.createOrUpdate = function(modelName, values, options){
		let upsertPromise = getModel(modelName).upsert(values, options);
		return upsertPromise;
	}

	//**************Read OPERATIONS************
	/* fineOne('TokenStore', {
                where: {
                    userId: userId,
                    orgId: orgId                    
                }
            });
    */
    self.findById = function(modelName,idValue){
    	let findByIdPromise  = getModel(modelName)
    							.findById(idValue);
    	return findByIdPromise;
    }
	self.findOne  = function(modelName,options){
		//Check if where condition contains primary key attribute then call findById
		var whereCondition = options.where;
		if(whereCondition){
			let primaryKeyAttribute = getPrimaryKeyAttributeName(modelName);
			if(primaryKeyAttribute!='' && whereCondition.primaryKeyAttribute){
				return self.findById(modelName,whereCondition.primaryKeyAttribute);
			}
		}

		let findOnePromise = getModel(modelName)
								.findOne(options);
		return findOnePromise;
	}
	self.findAll  = function(modelName,options){
		let findAllPromise = getModel(modelName)
								.findAll(options);
		return findAllPromise;
	}
	self.findOrCreate  = function(modelName,options){
		let findOrCreatePromise = getModel(modelName)
								.findOrCreate(options);
		return findOrCreatePromise;
	}
	self.update = function(modelName,values,options){
		let updatePromise = getModel(modelName)
								.update(values,options);
		return updatePromise;
	}
	self.delete  = function(modelName,options){
		let deletePromise = getModel(modelName)
								.destroy(options);
		return deletePromise;
	}
}

if(module!=undefined && module.exports!=undefined){
    module.exports = utilsDaoModule;
}
else{
    window.utilsDaoModule = utilsDaoModule;   
}