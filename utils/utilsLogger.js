
var log4js = require('log4js');
var developmentLogger = log4js.getLogger('Development');
//developmentLogger.setLevel('INFO');

var getLogger = function(tag){
	return log4js.getLogger(tag);
}

// log.trace("Trace Message!");
// log.debug("Debug Message!");
// log.info("Info Message!");
// log.warn("Warn Message!");
// log.error("Error Message!");
// log.fatal("Fatal Message!");


exports.getLogger = getLogger;