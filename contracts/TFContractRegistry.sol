// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io
/**
 * @dev Learn more about this on https://token-forge.io
 

 _______    _              ______                   
|__   __|  | |            |  ____|                  
   | | ___ | | _____ _ __ | |__ ___  _ __ __ _  ___ 
   | |/ _ \| |/ / _ \ '_ \|  __/ _ \| '__/ _` |/ _ \
   | | (_) |   <  __/ | | | | | (_) | | | (_| |  __/
   |_|\___/|_|\_\___|_| |_|_|  \___/|_|  \__, |\___|
                                          __/ |     
                                         |___/      

 */

pragma solidity >=0.8.12;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "hardhat/console.sol";

struct ContractItem {
    uint64 networkId;
    address contractAddress;
}
    
contract TFContractRegistry is AccessControlEnumerable {
    // **** Events ******
    event ContractRegistered(address operator, bytes32 key, uint64 networkId, address contractAddress);
    event ContractDeleted(address operator, bytes32 key, uint64 networkId);

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

    function deleteContract(string memory key, uint64 networkId) public onlyRegistrar {
        bytes32 _hash = getHashForKey(key);
        deleteContractByHash(_hash, networkId);
    }

    function registerContractByHash(bytes32 key, uint64 networkId, address _address) public onlyRegistrar {
        _contractsByNetworkId[key][networkId] = _address;

        bool updated = false;
        for (uint256 i = 0; i < _contracts[key].length; i++) {
            if (_contracts[key][i].networkId == networkId) {
                _contracts[key][i].contractAddress = _address;
                updated = true;
                break;
            }
        }

        if (!updated) {
            _contracts[key].push(ContractItem({networkId: networkId, contractAddress: _address}));
        }

        emit ContractRegistered(msg.sender, key, networkId, _address);
    }

    function deleteContractByHash(bytes32 key, uint64 networkId) public onlyRegistrar {
        delete _contractsByNetworkId[key][networkId];

        for (uint256 i = 0; i < _contracts[key].length; i++) {
            if (_contracts[key][i].networkId == networkId) {
                _removeItemInArray(key, i);
            }
        }

        emit ContractDeleted(msg.sender, key, networkId);
    }

    function _removeItemInArray(bytes32 key, uint index) internal {
        for (uint i = index; i < _contracts[key].length - 1; i++) {
            _contracts[key][i] = _contracts[key][i + 1];
        }
        _contracts[key].pop();
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
