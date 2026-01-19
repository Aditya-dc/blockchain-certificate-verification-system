const { ethers } = require("ethers");
const abi = require("./abi.json");

// Hardhat local RPC
const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);

// Hardhat account #0 private key (LOCAL ONLY)
const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Wallet signer
const wallet = new ethers.Wallet(privateKey, provider);

// Deployed contract address (LOCAL)
const contractAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Contract instance
const contract = new ethers.Contract(
  contractAddress,
  abi,
  wallet
);

module.exports = {
  contract,
  provider
};
