/**
 * Flattened Source Code for RWA Contracts
 * Used for automated Etherscan verification
 * 
 * Sources:
 * 1. FireblocksProxy (ERC1967)
 * 2. RWAOracle
 */

export const FIREBLOCKS_PROXY_SOURCE = `
// Sources flattened with hardhat v2.22.5 https://hardhat.org

// SPDX-License-Identifier: AGPL-3.0-or-later AND MIT

// File @openzeppelin/contracts/interfaces/draft-IERC1822.sol@v4.9.3
pragma solidity ^0.8.0;
interface IERC1822Proxiable {
    function proxiableUUID() external view returns (bytes32);
}

// File @openzeppelin/contracts/interfaces/IERC1967.sol@v4.9.3
pragma solidity ^0.8.0;
interface IERC1967 {
    event Upgraded(address indexed implementation);
    event AdminChanged(address previousAdmin, address newAdmin);
    event BeaconUpgraded(address indexed beacon);
}

// File @openzeppelin/contracts/proxy/beacon/IBeacon.sol@v4.9.3
pragma solidity ^0.8.0;
interface IBeacon {
    function implementation() external view returns (address);
}

// File @openzeppelin/contracts/utils/Address.sol@v4.9.3
pragma solidity ^0.8.1;
library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }
    function functionCallWithValue(address target, bytes memory data, uint256 value, string memory errorMessage) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }
    function functionDelegateCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }
    function verifyCallResultFromTarget(address target, bool success, bytes memory returndata, string memory errorMessage) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }
    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        if (returndata.length > 0) {
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}

// File @openzeppelin/contracts/utils/StorageSlot.sol@v4.9.3
pragma solidity ^0.8.0;
library StorageSlot {
    struct AddressSlot { address value; }
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly { r.slot := slot }
    }
}

// File @openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol@v4.9.3
pragma solidity ^0.8.2;
abstract contract ERC1967Upgrade is IERC1967 {
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    function _getImplementation() internal view returns (address) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }
    function _setImplementation(address newImplementation) private {
        require(Address.isContract(newImplementation), "ERC1967: new implementation is not a contract");
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }
    function _upgradeTo(address newImplementation) internal {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
    function _upgradeToAndCall(address newImplementation, bytes memory data, bool forceCall) internal {
        _upgradeTo(newImplementation);
        if (data.length > 0 || forceCall) {
            Address.functionDelegateCall(newImplementation, data);
        }
    }
}

// File @openzeppelin/contracts/proxy/Proxy.sol@v4.9.3
pragma solidity ^0.8.0;
abstract contract Proxy {
    function _delegate(address implementation) internal virtual {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    function _implementation() internal view virtual returns (address);
    function _fallback() internal virtual { _delegate(_implementation()); }
    fallback() external payable virtual { _fallback(); }
    receive() external payable virtual { _fallback(); }
}

// File @openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol@v4.9.3
pragma solidity ^0.8.0;
contract ERC1967Proxy is Proxy, ERC1967Upgrade {
    constructor(address _logic, bytes memory _data) payable {
        _upgradeToAndCall(_logic, _data, false);
    }
    function _implementation() internal view virtual override returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }
}

// File contracts/FireblocksProxy.sol
pragma solidity 0.8.20;
contract FireblocksProxy is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) payable {}
}
`;

export const RWA_ORACLE_SOURCE = `
// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.20;

/**
 * @title RWAOracle
 * @dev Simple oracle for Real-World Asset (RWA) metrics like NAV and PoR.
 */
contract RWAOracle {
    string public description;
    uint8 public decimals;
    int256 private _latestAnswer;
    uint256 public latestTimestamp;

    event AnswerUpdated(int256 indexed current, uint256 indexed timestamp);

    constructor(string memory _description, uint8 _decimals, int256 _initialAnswer) {
        description = _description;
        decimals = _decimals;
        _latestAnswer = _initialAnswer;
        latestTimestamp = block.timestamp;
    }

    function latestAnswer() external view returns (int256) {
        return _latestAnswer;
    }

    function updateAnswer(int256 _answer) external {
        _latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        emit AnswerUpdated(_answer, block.timestamp);
    }
}
`;
