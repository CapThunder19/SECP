// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IXCMBridge {
    enum Chain { PolkadotHub, Moonbeam, Acala, Astar, Arbitrum }
    
    function withdrawToCrossChain(address token, uint256 amount, Chain destinationChain) external;
    function initiateCrossChainDeposit(address user, address token, uint256 amount, Chain sourceChain) external returns (bytes32);
    function getPendingTransfers(address user, Chain chain) external view returns (uint256);
    function getTotalTVL() external view returns (uint256);
    function getChainTVL(Chain chain) external view returns (uint256);
}
