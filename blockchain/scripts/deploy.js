const hre = require("hardhat");

async function main() {
    const DAOGovernance =
        await hre.ethers.getContractFactory("DAOGovernance");

    const dao = await DAOGovernance.deploy();

    await dao.waitForDeployment();

    console.log(
        "DAOGovernance deployed to:",
        await dao.getAddress()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});