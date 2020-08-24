  
import { IBaselineRPC, IBlockchainService, IRegistry, IVault, baselineServiceFactory, baselineProviderProvide } from '@baseline-protocol/api';
import { IMessagingService, messagingProviderNats, messagingServiceFactory } from '@baseline-protocol/messaging';
import { IZKSnarkCircuitProvider, IZKSnarkCompilationArtifacts, IZKSnarkTrustedSetupArtifacts, zkSnarkCircuitProviderServiceFactory, zkSnarkCircuitProviderServiceZokrates } from '@baseline-protocol/privacy';
import { messageReservedBitsLength, Message as ProtocolMessage, Opcode, PayloadType } from '@baseline-protocol/types';
import { Application as Workgroup, Invite, Vault as ProvideVault, Organization, Token, Key as VaultKey } from '@provide/types';
import { Capabilities, Ident, NChain, Vault, capabilitiesFactory, nchainClientFactory } from 'provide-js';
import { readFileSync } from 'fs';
import { compile as solidityCompile } from 'solc';
import * as jwt from 'jsonwebtoken';
import { keccak256 } from 'js-sha3';

var baselineApiModule = function(){ 
    var self = this;

}

var PROVIDER_URL = ''; // Set Provider URL


// Baseline APIs

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



// Compile Baseline Circuit

self.compileBaselineCircuit = function(req,callbackFn){
    const path = readFileSync(baselineDocumentCircuitPath).toString();
    zk.compile(path, 'main')
    return baselineCircuitArtifacts;
}

self.compile = function(req,callbackFn){
    //console.log("IIIIIIIIIIIIIIIIIInn web3 req", req);
    try{
        if(req.version){
            console.log("in version", req.version);
            // getting the development snapshot
            solc.loadRemoteVersion(req.version, callbackFn);
        }else{
            console.log("######## in local version");            
            callbackFn('no error in solc', solc);
        }        

    }catch(e){
        console.log("##### catch", e);
        return e;
    }  
}

// Deploy Baseline Circuit

self.deployBaselineCircuit() {

    await this.compileBaselineCircuit();

    const setupArtifacts = zk.setup(this.baselineCircuitArtifacts.program);
    const compilerOutput = this.compile;

    await this.deployWorkgroupContract('Verifier', 'verifier', compilerOutput.response)

    const shieldAddress = await  this.deployWorkgroupShieldContract();
    const trackedShield = await baseline.track(shieldAddress);
    if (trackedSheild) {
        this.contracts['shield'] = {
            address: shieldAddress,
        }
    } else {
        console.log('WARNING: failed to track basline shield contract');
    }

    baselineCircuitSetupArtifacts = setupArtifacts;
    workflowIdentifier = baselineCircuitSetupArtifacts?.identifier;

    return setupArtifacts;

}




//********* WORKGROUP APIS *************/

// Create Workgroup 

self.createWorkgroup = function(name) {
    const resp = baseline.createWorkgroup({
        config: {
            baselined: true,
        },
        name: name,
        network_id: baselineConfig.networkId
    }).responseBody;
}

// Deploy Workgroup Contract

self.deployWorkgroupContract = function(name, type, contractParams) {

    if (!this.workgroupToken) {
        return this.PromiseRejectionEvent.apply('failed to deploy workgroup contract');
    }

    web3api.createContract(address, transactionsObj, call)
    // to do
      
};

// Set Workgroup

self.setWorkgroup(workgroup, workgroupToken) {
 
     baseline.setWorkgroup().then(function () {

     })

};


// Deploy Workgroup Contract

self.deployWorkgroupSheildContract() {

    const txHash = await baseline.rpcExec;

    baseline.deployBaselineCircuit().then(function () {


    })

}

// Resolve Workgroup Contract

self.resolveWorkgroupContract() {

    baseline.resolveWorkgroupContract().then(function () {

    })

}

// Generate Proof


self.generateProof(msg) {

    baseline.generateProof().then(function (msg) {

    const raw = JSON.stringify(msg);
    const privateInput = keccak256(raw);
    zk.computeWitness();
    zk.generateProof();
    return proof;
    })
}

// Send Nats Message

self.sendProtocolMessage = function(recipient, msg){
    const recipientNatsConn = await messagingServiceFactory(messagingProviderNats, {
        bearerToken: this.bearerToken,
        natsServers: messageEndpoint
    });
    await recipientNatsConn.connect();

    const wiremsg = this.serializeProtocolMessage(
        await this.protocolMessageFactory(
            recipient,
            this.contracts['shield'].address,
            this.workflowId,
            Buffer.from(JSON.stringify(msg)),
        ),
    );

    const result = recipientNatsConn.publish(baselineProtocolMessageSubject, wiremsg);
    this.protocolMessagesTx++;
    return result;
    
}


if(module!=undefined && module.exports!=undefined){
    module.exports = baselineApiModule;
}
else{
    window.baselineApiModule = baselineApiModule;   
}
  
