const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding + KYC Integration Test", function () {
  let deployer, user1, user2;
  let kyc, crowd;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy KYC
    const KYC = await ethers.getContractFactory("KYCRegistry_FahadSaleem");
    kyc = await KYC.deploy();
    await kyc.waitForDeployment();

    // Deploy Crowdfunding
    const Crowd = await ethers.getContractFactory("Crowdfunding_FahadSaleem");
    crowd = await Crowd.deploy(await kyc.getAddress());
    await crowd.waitForDeployment();
  });

  it("Should deploy contracts correctly", async function () {
    expect(await kyc.owner()).to.equal(deployer.address);
    expect(await crowd.owner()).to.equal(deployer.address);
  });

  it("Should allow user to submit and approve KYC", async function () {
    await kyc.connect(user1).submitKYCRequest("Fahad Saleem", "12345-6789012-3");

    const req = await kyc.kycRequests(user1.address);
    expect(req.name).to.equal("Fahad Saleem");
    expect(req.status).to.equal(0); // Pending

    await kyc.connect(deployer).approveKYC(user1.address);
    expect(await kyc.isApproved(user1.address)).to.be.true;
  });

  it("Should allow verified user to create campaign", async function () {
    await kyc.connect(user1).submitKYCRequest("Fahad Saleem", "12345-6789012-3");
    await kyc.connect(deployer).approveKYC(user1.address);

    await crowd.connect(user1).createCampaign(
      "Save Earth",
      "Tree planting campaign",
      ethers.parseEther("1")
    );

    const campaign = await crowd.getCampaign(1);
    expect(campaign.title).to.equal("Save Earth");
    expect(campaign.goalWei).to.equal(ethers.parseEther("1"));
  });

  it("Should allow anyone to contribute and complete the campaign", async function () {
    await kyc.connect(user1).submitKYCRequest("Fahad Saleem", "12345-6789012-3");
    await kyc.connect(deployer).approveKYC(user1.address);
    await crowd.connect(user1).createCampaign(
      "Save Earth",
      "Tree planting campaign",
      ethers.parseEther("1")
    );

    // Contribute from deployer
    await crowd.connect(deployer).contribute(1, { value: ethers.parseEther("0.5") });
    await crowd.connect(user2).contribute(1, { value: ethers.parseEther("0.5") });

    const campaign = await crowd.getCampaign(1);
    expect(campaign.fundsRaised).to.equal(ethers.parseEther("1"));
    expect(campaign.status).to.equal(1); // Completed
  });

  it("Should allow creator to withdraw funds after completion", async function () {
    await kyc.connect(user1).submitKYCRequest("Fahad Saleem", "12345-6789012-3");
    await kyc.connect(deployer).approveKYC(user1.address);
    await crowd.connect(user1).createCampaign(
      "Save Earth",
      "Tree planting campaign",
      ethers.parseEther("1")
    );

    await crowd.connect(deployer).contribute(1, { value: ethers.parseEther("1") });
    const beforeBal = await ethers.provider.getBalance(user1.address);

    const tx = await crowd.connect(user1).withdraw(1);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const afterBal = await ethers.provider.getBalance(user1.address);
    expect(afterBal + gasUsed).to.be.closeTo(beforeBal + ethers.parseEther("1"), ethers.parseEther("0.001"));
  });
});
