const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy KYC registry first
  const KYC = await hre.ethers.getContractFactory("KYCRegistry_FahadSaleem");
  const kyc = await KYC.deploy();
  await kyc.waitForDeployment();
  console.log("✅ KYC deployed at:", await kyc.getAddress());

  // Deploy Crowdfunding contract with the KYC address
  const CF = await hre.ethers.getContractFactory("Crowdfunding_FahadSaleem");
  const cf = await CF.deploy(await kyc.getAddress());
  await cf.waitForDeployment();
  console.log("✅ Crowdfunding deployed at:", await cf.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
