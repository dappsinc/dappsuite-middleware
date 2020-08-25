var baselineApiModule = function(){
    var self = this;

var PROVIDER_URL = ''; // Set Provider URL

var ETH_TX_PATH = './node_modules/ethereumjs-tx/index.js';

  
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
var Web3 = require('web3');
var solc = require('solc');
var Transaction = require(ETH_TX_PATH);

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_URL));
}

console.log("#####web3", web3.currentProvider)

// Baseline APIs

var baseline = baselineServiceFactory;
var nats = messageServiceFactory;
var baselineConfig;
var natsConfig;
var protocolMessagesRx = 0;
var protocolMessagesTx = 0;
var workgroup;
var workgroupToken;
var workflowIdentifier;
var zk = zkSnarkCircuitProviderServiceFactory;
self.baseline = baseline;
self.nats = nats;
self.zk = zk;

constructor(baselineConfig, natsConfig) {
    this.baselineConfig = baselineConfig;
    this.natsConfig = natsConfig;

    this.init();
  }

 async function init() {
    this.baseline = await baselineServiceFactory(baselineProviderProvide, this.baselineConfig);
    this.nats = await messagingServiceFactory(messagingProviderNats, this.natsConfig);
    this.zk = await zkSnarkCircuitProviderServiceFactory(zkSnarkCircuitProviderServiceZokrates, {
      importResolver: zokratesImportResolver,
    });
}



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

self.compileBaselineCircuit = function(){
    const path = readFileSync(baselineDocumentCircuitPath).toString();
    this.baselineCircuitArtifacts = await zk.compile(path, 'main')
    return baselineCircuitArtifacts;
}

// Compile

self.compile = function(req,callbackFn){
    
    try{
        if(req.version){
            console.log("in version", req.version);
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

// Sign Message

self.signMessage = async function(vaultId, keyId, message) {
    const orgToken = (await this.createOrgToken()).token;
    const vault = Vault.clientFactory(orgToken, this.baselineConfig?.vaultApiScheme, this.baselineConfig?.vaultApiHost);
    return (await vault.signMessage(vaultId, keyId, message));
  }

// Fetch Keys

 self.fetchKeys = async function() {
    const orgToken = (await this.createOrgToken()).token;
    const vault = Vault.clientFactory(orgToken, this.baselineConfig?.vaultApiScheme, this.baselineConfig?.vaultApiHost);
    const vaults = (await vault.fetchVaults({}));
    return (await vault.fetchVaultKeys(vaults[0].id, {}));
  }

// Deploy Baseline Circuit

self.deployBaselineCircuit = function(){

    await this.compileBaselineCircuit();

    const setupArtifacts = zk.setup(this.baselineCircuitArtifacts.program);
    const compilerOutput = this.compile;

    await this.deployWorkgroupContract('Verifier', 'verifier', compilerOutput.response)

    const shieldAddress = await  this.deployWorkgroupShieldContract();
    const trackedShield = await baseline.track(shieldAddress);
    if (trackedShield) {
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
}

// Accept Workgroup Invite

self.acceptWorkgroupInvite = function(_inviteToken, contracts){
    if (this.workgroup || this.workgroupToken || this.org || this.baselineConfig.initiator) {
        return Promise.reject('failed to accept workgroup invite');
      }

      const invite = jwt.decode(inviteToken);

      // deploy erc1820-registry
      // deploy organization-registry
      // deploy shield contract
      // deploy verifier contract

      // track
      //register organization
}


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

self.setWorkgroup = function(workgroup, workgroupToken) {
 
     baseline.setWorkgroup().then(function () {

     })

};


// Invite Workgroup Participant

self.inviteWorkgroupParticipant = function(email){
    //token
    //identApiScheme
    //identApiHost
    try {
        createInvitation({
            application_id: this.workgroup.id,
            email: email,
            permissions: 0,
            params: {
                erc1820_registry_contract_address: this.contracts['erc1820-registry'].address,
                invitor_organization_address: await this.resolveOrganizationAddress(),
                organization_registry_contract_address: this.contracts['organization-registry'].address,
                shield_contract_address: this.contracts['shield'].address,
                verifier_contract_address: this.contracts['verifier'].address,
                workflow_identifier: this.workflowIdentifier,
            },
        });
    }
}


// Deploy Workgroup Contract

self.deployWorkgroupSheildContract = function() {

    const txHash = await baseline.rpcExec;

    baseline.deployBaselineCircuit().then(function () {


    })

}

// Resolve Workgroup Contract

self.resolveWorkgroupContract = function() {

    baseline.resolveWorkgroupContract().then(function () {

    })

}


self.registerOrganization = function(name, messageEndpoint){
    baseline.createOrganization({
        name: name,
        metadata: {
            messaging_endpoint: messageEndpoint,
        },
    });

}


// Generate Proof


self.generateProof = function(msg) {

    const raw = JSON.stringify(msg);
    const privateInput = keccak256(raw);
    const witness = zk.computeWitness(this.baselineCircuitArtifacts, [privateInput]);
    const proof = zk.generateProof(this.baselineCircuitArtifacts.program, witness, this.baselineCircuitSetupArtifacts.keypair.pk);
    return proof;
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


// Start Protocol Subscriptions

self.startProtocolSubscriptions = function() {
    if (!this.nats?.isConnected()) {
        await this.nats?.connect();
      }
}

const subscription = await this.nats?.subscribe(baselineProtocolMessageSubject, (msg, err) => {
    console.log(`received ${msg.length}-byte protocol message: \n\t${msg}`);
    this.protocolMessagesRx++;
    this.ingestProtocolMessage(msg);
  });

  this.protocolSubscriptions.push(subscription);
  return this.protocolSubscriptions;

async function protocolMessageFactory(
    recipient,
    shield,
    identifier,
    payload,
  ) {
    const vaults = await this.fetchVaults();
    const key = await this.createVaultKey(vaults[0].id, 'secp256k1');
    const signature = (await this.signMessage(vaults[0].id, key.id, payload.toString('utf8'))).signature;

    return {
      opcode: Opcode.Baseline,
      recipient: recipient,
      shield: shield,
      identifier: identifier,
      signature: signature,
      type: PayloadType.Text,
      payload: payload,
    };
  }

    const reservedBits = Buffer.alloc(messageReservedBitsLength / 8);
    const buffer = Buffer.alloc(5 + 42 + 42 + 36 + 64 + 1 + reservedBits.length + msg.payload.length);

    buffer.write(msg.opcode);
    buffer.write(msg.recipient, 5);
    buffer.write(msg.shield, 5 + 42);
    buffer.write(msg.identifier, 5 + 42 + 42);
    buffer.write(reservedBits.toString(), 5 + 42 + 42 + 36);
    buffer.write(msg.signature, 5 + 42 + 42 + 36 + reservedBits.length);
    buffer.write(msg.type.toString(), 5 + 42 + 42 + 36 + reservedBits.length + 64);

    const encoding = msg.type === PayloadType.Binary ? 'binary' : 'utf8';
    buffer.write(msg.payload.toString(encoding), 5 + 42 + 42 + 36 + reservedBits.length + 64 + 1);

    return buffer;



if(module!=undefined && module.exports!=undefined){
    module.exports = baselineApiModule;
}
else{
    window.baselineApiModule = baselineApiModule;   
}
  
