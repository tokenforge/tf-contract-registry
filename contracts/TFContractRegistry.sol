// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io

pragma solidity >=0.8.12;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

struct ContractItem {
    uint64 networkId;
    address contractAddress;
}
    
contract TFContractRegistry is AccessControlEnumerable {
    // **** Events ******
    event ContractRegistered(address operator, bytes32 key, uint64 networkId, address contractAddress);

    // ***** Roles ********
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /**
     * @dev Throws if called by any account other than the registrar.
     */
    modifier onlyRegistrar() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(REGISTRAR_ROLE, _msgSender()),
            "TFContractRegistry: caller has no governor role and no admin role"
        );
        _;
    }

    mapping(bytes32 => mapping(uint64 => address)) private _contractsByNetworkId;
    mapping(bytes32 => ContractItem[]) private _contracts;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(REGISTRAR_ROLE, _msgSender());
    }

    function getHashForKey(string memory key) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(key));
    }

    function registerContract(string memory key, uint64 networkId, address _address) public onlyRegistrar {
        bytes32 _hash = getHashForKey(key);
        registerContractByHash(_hash, networkId, _address);
    }

    function registerContractByHash(bytes32 key, uint64 networkId, address _address) public onlyRegistrar {
        _contractsByNetworkId[key][networkId] = _address;
        _contracts[key].push( ContractItem({
            networkId: networkId,
            contractAddress: _address
        }));
        
        emit ContractRegistered(msg.sender, key, networkId, _address);
    }

    function getContract(string memory key, uint64 networkId) public view returns (address) {
        return _contractsByNetworkId[getHashForKey(key)][networkId];
    }

    function getContractByHash(bytes32 key, uint64 networkId) public view returns (address) {
        return _contractsByNetworkId[key][networkId];
    }

    function getContracts(string memory key) public view returns (ContractItem[] memory) {
        return _contracts[getHashForKey(key)];
    }

    function getContractsByHash(bytes32 key) public view returns (ContractItem[] memory) {
        return _contracts[key];
    }

}
