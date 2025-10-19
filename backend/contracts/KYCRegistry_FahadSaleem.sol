// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KYCRegistry_FahadSaleem {
    address public owner;

    enum Status { Pending, Approved, Rejected }

    struct KYCRequest {
        string name;
        string cnic;
        Status status;
    }

    mapping(address => KYCRequest) public kycRequests;
    mapping(address => bool) public approvedUsers;

    event KYCSubmitted(address indexed user, string name, string cnic);
    event KYCApproved(address indexed user);
    event KYCRejected(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice User submits KYC request
    function submitKYCRequest(string calldata _name, string calldata _cnic) external {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_cnic).length > 0, "Empty CNIC");
        require(kycRequests[msg.sender].status == Status.Pending || !approvedUsers[msg.sender], "Already submitted");
        kycRequests[msg.sender] = KYCRequest(_name, _cnic, Status.Pending);
        emit KYCSubmitted(msg.sender, _name, _cnic);
    }

    /// @notice Admin approves KYC
    function approveKYC(address _user) external onlyOwner {
        KYCRequest storage req = kycRequests[_user];
        require(req.status == Status.Pending, "Not pending");
        req.status = Status.Approved;
        approvedUsers[_user] = true;
        emit KYCApproved(_user);
    }

    /// @notice Admin rejects KYC
    function rejectKYC(address _user) external onlyOwner {
        KYCRequest storage req = kycRequests[_user];
        require(req.status == Status.Pending, "Not pending");
        req.status = Status.Rejected;
        emit KYCRejected(_user);
    }

    /// @notice Check if user is approved
    function isApproved(address _user) external view returns (bool) {
        return approvedUsers[_user];
    }
}
