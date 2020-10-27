var baselineApiModule = function(){
var self = this;

var PROVIDER_URL = 'https://ropsten.infura.io/v3/3a1d742cd66d43e1ab09e3af56012769'; // Set Provider URL

var ETH_TX_PATH = './node_modules/ethereumjs-tx/index.js';

  
var IBaselineRPC = require('@baseline-protocol/api');
var baselineServiceFactory = require('@baseline-protocol/api');
var baselineProviderProvide = require('@baseline-protocol/api');
var messagingProviderNats = require('@baseline-protocol/messaging');
var messagingServiceFactory = require('@baseline-protocol/messaging');
var zkSnarkCircuitProviderServiceFactory = require('@baseline-protocol/privacy');
var zkSnarkCircuitProviderServiceZokrates = require('@baseline-protocol/privacy');
var Vault = require('provide-js');
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

// Baseline RPCs

// Get Leaf from Shield Contract

self.getLeaf = function(address, index, callbackFn){
    IBaselineRPC.getLeaf({  address: address, 
                            index: index
                        },
    function(error,result){
        console.info('error:',error);
        console.info('result:',result);
        if(callbackFn)
            callbackFn(error,result);
        }
    );
}

// Get Leaves from Shield Contract

self.getLeaves = function(address, indexes, callbackFn){
    IBaselineRPC.getLeaves({  address: address,
                              indexes: indexes
                            },
    function(error,result){
        console.info('error:',error);
        console.info('result:',result);
        if(callbackFn)
            callbackFn(error,result);
        }
    );
}


// Insert Leaf from Shield Contract

self.insertLeaf = function(sender, address, value, callbackFn){
    IBaselineRPC.insertLeaf({   sender: sender,
                                address: address, 
                                value: value
                            },
        function(error,result){
        console.info('error:',error);
        console.info('result:',result);
        if(callbackFn)
            callbackFn(error,result);
        }
    )
}

// Insert Leaves from Shield Contract

self.insertLeaves = function(sender, address, value, callbackFn){
    IBaselineRPC.insertLeaves({   sender: sender,
                                  address: address,
                                  value: value
                              },
        function(error,result){
        console.info('error:',error);
        console.info('result:',result);
        if(callbackFn)
            callbackFn(error,result);
        }
    )
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


// Create Org Token

self.createOrgToken = async function(req,callbackFn){
        return await Ident.clientFactory(
          this.baselineConfig.token,
        ).createToken({
          organization_id: this.org.id,
        });
    }

// Sign Message

self.signMessage = async function(vaultId, keyId, message) {
    const orgToken = (await this.createOrgToken()).token;
    const vault = Vault.clientFactory(orgToken, this.baselineConfig.vaultApiScheme, this.baselineConfig.vaultApiHost);
    return (await vault.signMessage(vaultId, keyId, message));
  }

// Fetch Keys

 self.fetchKeys = async function() {
    const orgToken = (await this.createOrgToken()).token;
    const vault = Vault.clientFactory(orgToken, this.baselineConfig.vaultApiScheme, this.baselineConfig.vaultApiHost);
    const vaults = (await vault.fetchVaults({}));
    return (await vault.fetchVaultKeys(vaults[0].id, {}));
  }

// Compile Baseline Circuit

self.compileBaselineCircuit = async function(){
    const path = readFileSync(baselineDocumentCircuitPath).toString();
    this.baselineCircuitArtifacts = await zk.compile(path, 'main')
    return baselineCircuitArtifacts;
}


// Deploy Baseline Circuit

self.deployBaselineCircuit = async function(){

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
    workflowIdentifier = baselineCircuitSetupArtifacts.identifier;

    return setupArtifacts;

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

self.inviteWorkgroupParticipant = async function(email){
 
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


// Deploy Workgroup Contract

self.deployWorkgroupSheildContract = async function() {

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

self.sendProtocolMessage = async function(recipient, opcode, msg) {

    const messagingEndpoint = await this.resolveMessagingEndpoint(recipient);
    
    if (!messagingEndpoint) {
        return Promise.reject(`protocol message not sent; organization messaging endpoint not resolved for recipient: ${recipient}`);
    }

    const bearerToken = this.natsBearerTokens[messagingEndpoint];
    if (!bearerToken) {
      return Promise.reject(`protocol message not sent; no bearer authorization cached for endpoint of recipient: ${recipient}`);
    }

    const recipientNatsConn = await messagingServiceFactory(messagingProviderNats, {
        bearerToken: bearerToken,
        natsServers: messageEndpoint
    });

    await recipientNatsConn.connect();

    const wiremsg = this.marshalProtocolMessage(
        await this.protocolMessageFactory(
            opcode,
            recipient,
            this.contracts['shield'].address,
            this.workflowIdentifier,
            Buffer.from(JSON.stringify(msg)),
        ),
    );

    const result = recipientNatsConn.publish(baselineProtocolMessageSubject, wiremsg);
    this.protocolMessagesTx++;
    recipientNatsConn.disconnect();
    return result;
    
}

// Resolve Messaging Endpoint

self.resolveMessagingEndpoint = async function(addr) {
    const org = await this.fetchOrganization(addr);
    if (!org) {
      return Promise.reject(`organization not resolved: ${addr}`);
    }

    const messagingEndpoint = org['config'].messaging_endpoint;
    if (!messagingEndpoint) {
      return Promise.reject(`organization messaging endpoint not resolved for recipient: ${addr}`);
    }

    return messagingEndpoint;
  }

// Resolve NATS Bearer Token

self.resolveNatsBearerToken = async function(addr) {
    const endpoint = await this.resolveMessagingEndpoint(addr);
    if (!endpoint) {
      return Promise.reject(`failed to resolve messaging endpoint for participant: ${addr}`);
    }
    return this.natsBearerTokens[endpoint];
  }



// Start Protocol Subscriptions

self.startProtocolSubscriptions = async function() {
    if (!this.nats.isConnected()) {
        await this.nats.connect();
      }

const subscription = await this.nats.subscribe(baselineProtocolMessageSubject, (msg, err) => {
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
            }
        }
    };

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
}

if(module!=undefined && module.exports!=undefined){
    module.exports = baselineApiModule;
}
else{
    window.baselineApiModule = baselineApiModule;   
}