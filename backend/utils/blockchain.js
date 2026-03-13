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

  const disputeContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Contract instance
const contract = new ethers.Contract(
  contractAddress,
  abi,
  wallet
);

// Dispute contract ABI
const disputeABI = [
  "function raiseDispute(uint256 certificateId, string memory reason)",
  "function submitEvidence(uint256 disputeId, string memory ipfsHash)",
  "function resolveDispute(uint256 disputeId, bool certificateValid)",
  "function disputeCount() view returns (uint256)",
  "function disputes(uint256) view returns (uint256,address,string,string,bool,bool)"
];

// Dispute contract instance
const disputeContract = new ethers.Contract(
  disputeContractAddress,
  disputeABI,
  wallet
);
module.exports = {
  contract,
  disputeContract,
  provider
};