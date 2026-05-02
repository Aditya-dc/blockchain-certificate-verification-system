const { ethers } = require("ethers");
const abi = require("./abi.json");

// =========================
// PROVIDER
// =========================
const provider = new ethers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);

// =========================
// 🔥 ISSUER WALLET (for issuing certificates)
// =========================
const issuerPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const issuerWallet = new ethers.Wallet(issuerPrivateKey, provider);

// =========================
// 🔥 MULTIPLE SIGNERS (DAO voting)
// =========================
const privateKeys = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // acc 0
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // acc 1
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"  // acc 2
];

let currentSignerIndex = 0;

function getSigner() {
  const wallet = new ethers.Wallet(
    privateKeys[currentSignerIndex],
    provider
  );

  currentSignerIndex =
    (currentSignerIndex + 1) % privateKeys.length;

  return wallet;
}

// =========================
// CONTRACT ADDRESSES
// =========================
const contractAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const disputeContractAddress =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// =========================
// CERTIFICATE CONTRACT (uses issuer wallet)
// =========================
const contract = new ethers.Contract(
  contractAddress,
  abi,
  issuerWallet // ✅ signer required
);

// =========================
// DISPUTE CONTRACT (read-only, signer injected later)
// =========================
const disputeABI = [
  "function raiseDispute(uint256 certificateId, string memory reason)",
  "function submitEvidence(uint256 disputeId, string memory ipfsHash)",
  "function vote(uint256 disputeId, bool voteValid)",
  "function disputeCount() view returns (uint256)",
  "function disputes(uint256) view returns (uint256,address,string,string,bool,bool,uint256,uint256)"
];

const disputeContract = new ethers.Contract(
  disputeContractAddress,
  disputeABI,
  provider // ✅ no wallet here
);

function getSignerByUserId(userId) {
  const index = parseInt(userId || 0) % privateKeys.length;

  return new ethers.Wallet(privateKeys[index], provider);
}

// =========================
// EXPORTS
// =========================
module.exports = {
  contract,           // for issuing certificates
  disputeContract,    // for reading disputes
  getSigner,   
  getSignerByUserId,       // 🔥 for DAO voting
  provider

};