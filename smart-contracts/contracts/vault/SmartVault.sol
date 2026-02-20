// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartVault is Ownable {
    struct Collateral {
        uint256 amount;
        bool enabled;
    }

    mapping(address => mapping(address => Collateral)) public collateral;
    mapping(address => bool) public supportedTokens;
    mapping(address => address[]) public userTokens;

    mapping(address => bool) public frozen;

    event Deposit(address user, address token, uint256 amount);
    event Withdraw(address user, address token, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function deposit(address token, uint256 amount) external {
        require(supportedTokens[token], "Not supported");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        if (!collateral[msg.sender][token].enabled) {
            userTokens[msg.sender].push(token);
            collateral[msg.sender][token].enabled = true;
        }

        collateral[msg.sender][token].amount += amount;

        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require(!frozen[msg.sender], "Vault frozen");

        Collateral storage col = collateral[msg.sender][token];
        require(col.amount >= amount, "Low balance");

        col.amount -= amount;
        IERC20(token).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount);
    }

    function freezeVault(address user) external onlyOwner {
        frozen[user] = true;
    }

    function unfreezeVault(address user) external onlyOwner {
        frozen[user] = false;
    }

    function getUserTokens(address user)
        external
        view
        returns (address[] memory)
    {
        return userTokens[user];
    }

    function getCollateral(address user, address token)
        external
        view
        returns (uint256)
    {
        return collateral[user][token].amount;
    }
}
