const hre = require("hardhat");

async function main() {

    const disputeAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    const disputeContract = await hre.ethers.getContractAt(
        "DisputeManager",
        disputeAddress
    );

    const tx = await disputeContract.raiseDispute(
        1,
        "Employer suspects fake certificate"
    );

    await tx.wait();

    console.log("✅ Dispute raised successfully!");

    const dispute = await disputeContract.disputes(1);

    console.log("Dispute Data:");
    console.log(dispute);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});