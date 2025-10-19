// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KYCRegistry_FahadSaleem.sol";

/// @title Crowdfunding_FahadSaleem
/// @notice Crowdfunding contract using KYCRegistry_FahadSaleem for creator verification.
contract Crowdfunding_FahadSaleem {
    address public owner;
    KYCRegistry_FahadSaleem public kycRegistry;

    uint256 public nextCampaignId;

    enum CampaignStatus { Active, Completed, Withdrawn }

    struct Campaign {
        uint256 id;
        address payable creator;
        string title;
        string description;
        uint256 goalWei;
        uint256 fundsRaised;
        CampaignStatus status;
        uint256 createdAt;
    }

    // id => Campaign
    mapping(uint256 => Campaign) public campaigns;
    // campaignId => contributor => amount
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // For listing campaigns on frontend
    uint256[] public campaignIds;

    // Simple reentrancy guard for withdrawals
    bool private locked;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goalWei);
    event ContributionMade(uint256 indexed id, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyVerifiedOrAdmin() {
        // admin (owner) or approved KYC user can create campaigns
        if (msg.sender == owner) {
            _;
            return;
        }
        require(kycRegistry.isApproved(msg.sender), "Not KYC approved");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _kycRegistryAddress) {
        owner = msg.sender;
        kycRegistry = KYCRegistry_FahadSaleem(_kycRegistryAddress);
        nextCampaignId = 1;
        locked = false;
    }

    /// @notice Create a new campaign. Only verified users or admin can call.
    /// @param _title Title of campaign
    /// @param _description Short description
    /// @param _goalWei funding goal in ETH (frontend may convert); this function expects wei
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goalWei
    ) external onlyVerifiedOrAdmin returns (uint256) {
        require(_goalWei > 0, "Goal must be > 0");

        uint256 cid = nextCampaignId++;
        Campaign storage c = campaigns[cid];

        c.id = cid;
        c.creator = payable(msg.sender);
        c.title = _title;
        c.description = _description;
        c.goalWei = _goalWei;
        c.fundsRaised = 0;
        c.status = CampaignStatus.Active;
        c.createdAt = block.timestamp;

        campaignIds.push(cid);

        emit CampaignCreated(cid, msg.sender, _title, _goalWei);
        return cid;
    }

    /// @notice Contribute ETH to an active campaign. Anyone can contribute.
    /// @param _campaignId id of campaign
    function contribute(uint256 _campaignId) external payable {
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Invalid campaign");
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(msg.value > 0, "No ETH sent");

        c.fundsRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        emit ContributionMade(_campaignId, msg.sender, msg.value);

        // If goal reached or exceeded, mark as completed
        if (c.fundsRaised >= c.goalWei) {
            c.status = CampaignStatus.Completed;
        }
    }

    /// @notice Withdraw funds for a completed campaign. Only creator can withdraw.
    /// @param _campaignId id of campaign
    function withdraw(uint256 _campaignId) external nonReentrant {
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Invalid campaign");
        require(c.creator == msg.sender, "Only creator");
        require(c.status == CampaignStatus.Completed, "Not completed or already withdrawn");
        uint256 amount = c.fundsRaised;
        require(amount > 0, "No funds");

        // Update state before external call
        c.fundsRaised = 0;
        c.status = CampaignStatus.Withdrawn;

        // Transfer funds
        (bool success, ) = c.creator.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_campaignId, c.creator, amount);
    }

    /// @notice Get number of campaigns created
    function getCampaignCount() external view returns (uint256) {
        return campaignIds.length;
    }

    /// @notice Get campaign IDs array (for frontend listing)
    function getCampaignIds() external view returns (uint256[] memory) {
        return campaignIds;
    }

    /// @notice Get campaign details by id
    /// @param _campaignId id to query
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (
            uint256 id,
            address creator,
            string memory title,
            string memory description,
            uint256 goalWei,
            uint256 fundsRaised,
            CampaignStatus status,
            uint256 createdAt
        )
    {
        Campaign storage c = campaigns[_campaignId];
        require(c.id != 0, "Invalid campaign");
        return (
            c.id,
            c.creator,
            c.title,
            c.description,
            c.goalWei,
            c.fundsRaised,
            c.status,
            c.createdAt
        );
    }

    /// @notice Allow owner to update KYC registry address (in case of redeploy)
    function setKYCRegistry(address _newRegistry) external onlyOwner {
        require(_newRegistry != address(0), "Zero address");
        kycRegistry = KYCRegistry_FahadSaleem(_newRegistry);
    }

    // Fallback/receive to accept plain ETH (not tied to a campaign)
    receive() external payable {}
}
