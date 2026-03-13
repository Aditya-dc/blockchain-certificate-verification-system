const hre = require("hardhat");

async function main() {

  const DisputeManager = await hre.ethers.getContractFactory("DisputeManager");

  const disputeManager = await DisputeManager.deploy();

  await disputeManager.waitForDeployment();

  console.log("DisputeManager deployed to:", await disputeManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});