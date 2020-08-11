import { IBaselineRPC, IBlockchainService, IRegistry, IVault, baselineServiceFactory, baselineProviderProvide } from '@baseline-protocol/api';
import { IMessagingService, messagingProviderNats, messagingServiceFactory } from '@baseline-protocol/messaging';
import { IZKSnarkCircuitProvider, zkSnarkCircuitProviderServiceFactory, zkSnarkCircuitProviderServiceZokrates } from '@baseline-protocol/privacy';
import { readFileSync } from 'fs';
import baseline from 'provide-js'

var baselineApiModule = function(){ 
    var self = this;

}


var baseline = baselineServiceFactory;
var nats = messageServiceFactory;
var zk = zkSnarkCircuitProviderServiceFactory;
self.baseline = baseline;
self.nats = nats;
self.zk = zk;

self.commonCallback = function(error,result){
    console.info('error:',error);
    console.info('result:',result);
}

self.checkCallbackFn = function(callbackFn){
    if(callbackFn)
        return callbackFn;
    else 
        return self.commonCallback;
}

self.createWorkgroup = function(name) {
    const resp = self.baseline.createWorkgroup({
        config: {
            baselined: true,
        },
        name: name,
        network_id: ''
    }).responseBody;
}



// provide.js response for inbound messages
// subscription from NATS
// call create Record with marshalled parameters from Baseline



if(module!=undefined && module.exports!=undefined){
    module.exports = baselineApiModule;
}
else{
    window.baselineApiModule = baselineApiModule;   
}
  
