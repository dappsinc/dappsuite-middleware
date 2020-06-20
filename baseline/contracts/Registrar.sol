pragma solidity ^0.5.8;


interface ERC1820ImplementerInterface {
    /// @notice Indicates whether the contract implements the interface 'interfaceHash' for the address 'addr' or not.
    /// @param interfaceHash keccak256 hash of the name of the interface
    /// @param addr Address for which the contract will implement the interface
    /// @return ERC1820_ACCEPT_MAGIC only if the contract implements 'interfaceHash' for the address 'addr'.
    function canImplementInterfaceForAddress(bytes32 interfaceHash, address addr) external view returns(bytes32);
}


/// @title ERC1820 Pseudo-introspection Registry Contract
/// @author Jordi Baylina and Jacques Dafflon
/// @notice This contract is the official implementation of the ERC1820 Registry.
/// @notice For more details, see https://eips.ethereum.org/EIPS/eip-1820
contract ERC1820Registry {
    /// @notice ERC165 Invalid ID.
    bytes4 constant internal INVALID_ID = 0xffffffff;
    /// @notice Method ID for the ERC165 supportsInterface method (= `bytes4(keccak256('supportsInterface(bytes4)'))`).
    bytes4 constant internal ERC165ID = 0x01ffc9a7;
    /// @notice Magic value which is returned if a contract implements an interface on behalf of some other address.
    bytes32 constant internal ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    /// @notice mapping from addresses and interface hashes to their implementers.
    mapping(address => mapping(bytes32 => address)) internal interfaces;
    /// @notice mapping from addresses to their manager.
    mapping(address => address) internal managers;
    /// @notice flag for each address and erc165 interface to indicate if it is cached.
    mapping(address => mapping(bytes4 => bool)) internal erc165Cached;

    /// @notice Indicates a contract is the 'implementer' of 'interfaceHash' for 'addr'.
    event InterfaceImplementerSet(address indexed addr, bytes32 indexed interfaceHash, address indexed implementer);
    /// @notice Indicates 'newManager' is the address of the new manager for 'addr'.
    event ManagerChanged(address indexed addr, address indexed newManager);

    /// @notice Query if an address implements an interface and through which contract.
    /// @param _addr Address being queried for the implementer of an interface.
    /// (If '_addr' is the zero address then 'msg.sender' is assumed.)
    /// @param _interfaceHash Keccak256 hash of the name of the interface as a string.
    /// E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
    /// @return The address of the contract which implements the interface '_interfaceHash' for '_addr'
    /// or '0' if '_addr' did not register an implementer for this interface.
    function getInterfaceImplementer(address _addr, bytes32 _interfaceHash) external view returns (address) {
        address addr = _addr == address(0) ? msg.sender : _addr;
        if (isERC165Interface(_interfaceHash)) {
            bytes4 erc165InterfaceHash = bytes4(_interfaceHash);
            return implementsERC165Interface(addr, erc165InterfaceHash) ? addr : address(0);
        }
        return interfaces[addr][_interfaceHash];
    }

    /// @notice Sets the contract which implements a specific interface for an address.
    /// Only the manager defined for that address can set it.
    /// (Each address is the manager for itself until it sets a new manager.)
    /// @param _addr Address for which to set the interface.
    /// (If '_addr' is the zero address then 'msg.sender' is assumed.)
    /// @param _interfaceHash Keccak256 hash of the name of the interface as a string.
    /// E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
    /// @param _implementer Contract address implementing '_interfaceHash' for '_addr'.
    function setInterfaceImplementer(address _addr, bytes32 _interfaceHash, address _implementer) external {
        address addr = _addr == address(0) ? msg.sender : _addr;
        require(getManager(addr) == msg.sender, "Not the manager");

        require(!isERC165Interface(_interfaceHash), "Must not be an ERC165 hash");
        if (_implementer != address(0) && _implementer != msg.sender) {
            require(
                ERC1820ImplementerInterface(_implementer)
                    .canImplementInterfaceForAddress(_interfaceHash, addr) == ERC1820_ACCEPT_MAGIC,
                "Does not implement the interface"
            );
        }
        interfaces[addr][_interfaceHash] = _implementer;
        emit InterfaceImplementerSet(addr, _interfaceHash, _implementer);
    }

    /// @notice Sets '_newManager' as manager for '_addr'.
    /// The new manager will be able to call 'setInterfaceImplementer' for '_addr'.
    /// @param _addr Address for which to set the new manager.
    /// @param _newManager Address of the new manager for 'addr'. (Pass '0x0' to reset the manager to '_addr'.)
    function setManager(address _addr, address _newManager) external {
        require(getManager(_addr) == msg.sender, "Not the manager");
        managers[_addr] = _newManager == _addr ? address(0) : _newManager;
        emit ManagerChanged(_addr, _newManager);
    }

    /// @notice Get the manager of an address.
    /// @param _addr Address for which to return the manager.
    /// @return Address of the manager for a given address.
    function getManager(address _addr) public view returns(address) {
        // By default the manager of an address is the same address
        if (managers[_addr] == address(0)) {
            return _addr;
        } else {
            return managers[_addr];
        }
    }

    /// @notice Compute the keccak256 hash of an interface given its name.
    /// @param _interfaceName Name of the interface.
    /// @return The keccak256 hash of an interface name.
    function interfaceHash(string calldata _interfaceName) external pure returns(bytes32) {
        return keccak256(abi.encodePacked(_interfaceName));
    }

    /* --- ERC165 Related Functions --- */
    /* --- Developed in collaboration with William Entriken. --- */

    /// @notice Updates the cache with whether the contract implements an ERC165 interface or not.
    /// @param _contract Address of the contract for which to update the cache.
    /// @param _interfaceId ERC165 interface for which to update the cache.
    function updateERC165Cache(address _contract, bytes4 _interfaceId) external {
        interfaces[_contract][_interfaceId] = implementsERC165InterfaceNoCache(
            _contract, _interfaceId) ? _contract : address(0);
        erc165Cached[_contract][_interfaceId] = true;
    }

    /// @notice Checks whether a contract implements an ERC165 interface or not.
    //  If the result is not cached a direct lookup on the contract address is performed.
    //  If the result is not cached or the cached value is out-of-date, the cache MUST be updated manually by calling
    //  'updateERC165Cache' with the contract address.
    /// @param _contract Address of the contract to check.
    /// @param _interfaceId ERC165 interface to check.
    /// @return True if '_contract' implements '_interfaceId', false otherwise.
    function implementsERC165Interface(address _contract, bytes4 _interfaceId) public view returns (bool) {
        if (!erc165Cached[_contract][_interfaceId]) {
            return implementsERC165InterfaceNoCache(_contract, _interfaceId);
        }
        return interfaces[_contract][_interfaceId] == _contract;
    }

    /// @notice Checks whether a contract implements an ERC165 interface or not without using nor updating the cache.
    /// @param _contract Address of the contract to check.
    /// @param _interfaceId ERC165 interface to check.
    /// @return True if '_contract' implements '_interfaceId', false otherwise.
    function implementsERC165InterfaceNoCache(address _contract, bytes4 _interfaceId) public view returns (bool) {
        uint256 success;
        uint256 result;

        (success, result) = noThrowCall(_contract, ERC165ID);
        if (success == 0 || result == 0) {
            return false;
        }

        (success, result) = noThrowCall(_contract, INVALID_ID);
        if (success == 0 || result != 0) {
            return false;
        }

        (success, result) = noThrowCall(_contract, _interfaceId);
        if (success == 1 && result == 1) {
            return true;
        }
        return false;
    }

    /// @notice Checks whether the hash is a ERC165 interface (ending with 28 zeroes) or not.
    /// @param _interfaceHash The hash to check.
    /// @return True if '_interfaceHash' is an ERC165 interface (ending with 28 zeroes), false otherwise.
    function isERC165Interface(bytes32 _interfaceHash) internal pure returns (bool) {
        return _interfaceHash & 0x00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF == 0;
    }

    /// @dev Make a call on a contract without throwing if the function does not exist.
    function noThrowCall(address _contract, bytes4 _interfaceId)
        internal view returns (uint256 success, uint256 result)
    {
        bytes4 erc165ID = ERC165ID;

        assembly {
            let x := mload(0x40)               // Find empty storage location using "free memory pointer"
            mstore(x, erc165ID)                // Place signature at beginning of empty storage
            mstore(add(x, 0x04), _interfaceId) // Place first argument directly next to signature

            success := staticcall(
                30000,                         // 30k gas
                _contract,                     // To addr
                x,                             // Inputs are stored at location x
                0x24,                          // Inputs are 36 (4 + 32) bytes long
                x,                             // Store output over input (saves space)
                0x20                           // Outputs are 32 bytes long
            )

            result := mload(x)                 // Load the result
        }
    }
}




/// @dev Contract that acts as a client for interacting with the ERC1820Registry
contract Registrar {

    ERC1820Registry ERC1820REGISTRY;

    bytes32 constant internal ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyManager() {
        require(msg.sender == getManager(), "You are not authorised to invoke this function");
        _;
    }

    
    /// @notice Constructor that takes an argument of the ERC1820RegistryAddress
    /// @dev Upon actual deployment of a static registry contract, this argument can be removed
    /// @param ERC1820RegistryAddress pre-deployed ERC1820 registry address
    constructor (address ERC1820RegistryAddress) public {
        // Below line is to be uncommented during actual deployment since mainnet has a version of this address
        // ERC1820Registry constant ERC1820REGISTRY = ERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820REGISTRY = ERC1820Registry(ERC1820RegistryAddress);
    }

    /// @dev This enables setting the interface implementation
    /// @notice Since this is an internal method any contract inheriting this contract would be
    /// leveraged as the sender for the interface registry
    /// @param _interfaceLabel label for the interface or the contract that is to be registered
    /// @param _implementation the implementing contract's address
    function setInterfaceImplementation(string memory _interfaceLabel, address _implementation) internal {
        bytes32 interfaceHash = keccak256(abi.encodePacked(_interfaceLabel));
        ERC1820REGISTRY.setInterfaceImplementer(address(this), interfaceHash, _implementation);
    }

    /// @dev This enables getting the address of the implementer
    /// @param addr the address for which the implementer is deployed
    /// @param _interfaceLabel label for the interface or the contract that is registered
    function interfaceAddr(address addr, string calldata _interfaceLabel) external view returns(address) {
        bytes32 interfaceHash = keccak256(abi.encodePacked(_interfaceLabel));
        return ERC1820REGISTRY.getInterfaceImplementer(addr, interfaceHash);
    }

    /// @dev This enables assigning or changing manager
    /// @notice Since this is an internal method any contract inheriting this contract would be
    /// leveraged to call this function directly
    /// @param _newManager address of the new manager who could set new interface implementations
    function assignManagement(address _newManager) internal {
        ERC1820REGISTRY.setManager(address(this), _newManager);
    }

    /// @dev This allows you to get this contract manager address
    function getManager() public view returns(address) {
        return ERC1820REGISTRY.getManager(address(this));
    }
}


/// @dev Contract for maintaining organization registry
/// Contract inherits from Ownable and ERC165Compatible
/// Ownable contains ownership criteria of the organization registry
/// ERC165Compatible contains interface compatibility checks
contract OrgRegistry is Ownable, ERC165Compatible, Registrar, IOrgRegistry {
    /// @notice Leverages roles contract as imported above to assign different roles
    using Roles for Roles.Role;

    enum Role {Null, Buyer, Supplier, Carrier}

    struct Org {
        address orgAddress;
        bytes32 name;
        uint role;
        bytes messagingKey;
        bytes zkpPublicKey;
    }

    struct OrgInterfaces {
        bytes32 groupName;
        address tokenAddress;
        address shieldAddress;
        address verifierAddress;
    }

    mapping (address => Org) orgMap;
    mapping (uint => OrgInterfaces) orgInterfaceMap;
    uint orgInterfaceCount;
    mapping (uint => Roles.Role) private roleMap;
    // address[] public parties;
    Org[] orgs;
    mapping(address => address) managerMap;

    event RegisterOrg(
        bytes32 _name,
        address _address,
        uint _role,
        bytes _messagingKey,
        bytes _zkpPublicKey
    );

    /// @dev constructor function that takes the address of a pre-deployed ERC1820
    /// registry. Ideally, this contract is a publicly known address:
    /// 0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24. Inherently, the constructor
    /// sets the interfaces and registers the current contract with the global registry
    constructor(address _erc1820) public ERC165Compatible() Registrar(_erc1820) {
        setInterfaces();
        setInterfaceImplementation("IOrgRegistry", address(this));
    }

    /// @notice This is an implementation of setting interfaces for the organization
    /// registry contract
    /// @dev the character '^' corresponds to bit wise xor of individual interface id's
    /// which are the parsed 4 bytes of the function signature of each of the functions
    /// in the org registry contract
    function setInterfaces() public onlyOwner returns (bool) {
        /// 0x54ebc817 is equivalent to the bytes4 of the function selectors in IOrgRegistry
        supportedInterfaces[this.registerOrg.selector ^
                            this.registerInterfaces.selector ^
                            this.getOrgs.selector ^
                            this.getOrgCount.selector ^
                            this.getInterfaceAddresses.selector] = true;
        return true;
    }

    /// @notice This function is a helper function to be able to get the
    /// set interface id by the setInterfaces()
    function getInterfaces() external pure returns (bytes4) {
        return this.registerOrg.selector ^
                this.registerInterfaces.selector ^
                this.getOrgs.selector ^
                this.getOrgCount.selector ^
                this.getInterfaceAddresses.selector;
    }

    /// @dev Since this is an inherited method from ERC165 Compatible, it returns the value of the interface id
    /// set during the deployment of this contract
    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return supportedInterfaces[interfaceId];
    }

    /// @notice Indicates whether the contract implements the interface 'interfaceHash' for the address 'addr' or not.
    /// @dev Below implementation is necessary to be able to have the ability to register with ERC1820
    /// @param interfaceHash keccak256 hash of the name of the interface
    /// @param addr Address for which the contract will implement the interface
    /// @return ERC1820_ACCEPT_MAGIC only if the contract implements 'interfaceHash' for the address 'addr'.
    function canImplementInterfaceForAddress(bytes32 interfaceHash, address addr) external view returns(bytes32) {
        return ERC1820_ACCEPT_MAGIC;
    }

    /// @dev Since this is an inherited method from Registrar, it allows for a new manager to be set
    /// for this contract instance
    function assignManager(address _newManager) onlyOwner external {
        assignManagement(_newManager);
    }

    /// @notice Function to register an organization
    /// @param _address ethereum address of the registered organization
    /// @param _name name of the registered organization
    /// @param _role role of the registered organization
    /// @param _messagingKey public key required for message communication
    /// @param _zkpPublicKey public key required for commitments & to verify EdDSA signatures with
    /// @dev Function to register an organization
    /// @return `true` upon successful registration of the organization
    function registerOrg(
        address _address,
        bytes32 _name,
        uint _role,
        bytes calldata _messagingKey,
        bytes calldata _zkpPublicKey
    ) external onlyOwner returns (bool) {
        Org memory org = Org(_address, _name, _role, _messagingKey, _zkpPublicKey);
        roleMap[_role].add(_address);
        orgMap[_address] = org;
        orgs.push(org);
        // parties.push(_address);
        emit RegisterOrg(
            _name,
            _address,
            _role,
            _messagingKey,
            _zkpPublicKey
        );
        return true;
    }

    /// @notice Function to register the names of the interfaces associated with the OrgRegistry
    /// @param _groupName name of the working group registered by an organization
    /// @param _tokenAddress name of the registered token interface
    /// @param _shieldAddress name of the registered shield registry interface
    /// @param _verifierAddress name of the verifier registry interface
    /// @dev Function to register an organization's interfaces for easy lookup
    /// @return `true` upon successful registration of the organization's interfaces
    function registerInterfaces(
        bytes32 _groupName,
        address _tokenAddress,
        address _shieldAddress,
        address _verifierAddress
    ) external onlyOwner returns (bool) {
        orgInterfaceMap[orgInterfaceCount] = OrgInterfaces(
            _groupName,
            _tokenAddress,
            _shieldAddress,
            _verifierAddress
        );
        orgInterfaceCount++;
        return true;
    }

    /// @dev Function to get the count of number of organizations to help with extraction
    /// @return length of the array containing organization addresses
    function getOrgCount() external view returns (uint) {
        return orgs.length;
    }

    /// @notice Function to get a single organization's details
    function getOrg(address _address) external view returns (
        address,
        bytes32,
        uint,
        bytes memory,
        bytes memory
    ) {
        return (
            orgMap[_address].orgAddress,
            orgMap[_address].name,
            orgMap[_address].role,
            orgMap[_address].messagingKey,
            orgMap[_address].zkpPublicKey
        );
    }

    /// @notice Function to get a single organization's interface details
    function getInterfaceAddresses() external view returns (
        bytes32[] memory,
        address[] memory,
        address[] memory,
        address[] memory
    ) {
        bytes32[] memory gName = new bytes32[](orgInterfaceCount);
        address[] memory tfAddress = new address[](orgInterfaceCount);
        address[] memory sAddress = new address[](orgInterfaceCount);
        address[] memory vrAddress = new address[](orgInterfaceCount);

        for (uint i = 0; i < orgInterfaceCount; i++) {
            OrgInterfaces storage orgInterfaces = orgInterfaceMap[i];
            gName[i] = orgInterfaces.groupName;
            tfAddress[i] = orgInterfaces.tokenAddress;
            sAddress[i] = orgInterfaces.shieldAddress;
            vrAddress[i] = orgInterfaces.verifierAddress;
        }
        return (
            gName,
            tfAddress,
            sAddress,
            vrAddress
        );
    }

    // @notice Function to retrieve a page of registered organizations along with details
    // @notice start and end indices here are a convenience for pagination
    // @param start starting index of the array where organization addresses are stored
    // @param count ending index of the array where organization addresses are stored
    // @dev Getter to retrieve details of the organization enabled for pagination
    // @return array form of the details of the organization as stored in the struct
    function getOrgs() external view returns (
        address[] memory,
        bytes32[] memory,
        uint[] memory,
        bytes[] memory,
        bytes[] memory
    ) {
        address[] memory addresses = new address[](orgs.length);
        bytes32[] memory names = new bytes32[](orgs.length);
        uint[] memory roles = new uint[](orgs.length);
        bytes[] memory messagingKeys = new bytes[](orgs.length);
        bytes[] memory zkpPublicKeys = new bytes[](orgs.length);

        for (uint i = 0; i < orgs.length; i++) {
            addresses[i] = orgs[i].orgAddress;
            names[i] = orgs[i].name;
            roles[i] = orgs[i].role;
            messagingKeys[i] = orgs[i].messagingKey;
            zkpPublicKeys[i] = orgs[i].zkpPublicKey;
        }

        return (
            addresses,
            names,
            roles,
            messagingKeys,
            zkpPublicKeys
        );
    }
}