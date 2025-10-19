import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  KYC_ABI,
  KYC_CONTRACT_ADDRESS,
  CROWDFUNDING_ABI,
  CROWDFUNDING_CONTRACT_ADDRESS,
} from "./contractConfig";

import KYCForm from "./components/KYCForm";
import CreateCampaign from "./components/CreateCampaign";

function App() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState(null);
  const [status, setStatus] = useState("Not connected");

  const [kycContract, setKycContract] = useState(null);
  const [crowdfundingContract, setCrowdfundingContract] = useState(null);

  const [kycRequests, setKycRequests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // -----------------------------
  // 🔹 Connect MetaMask + Setup
  // -----------------------------
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Initialize smart contracts
      const kyc = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_ABI, signer);
      const crowdfunding = new ethers.Contract(
        CROWDFUNDING_CONTRACT_ADDRESS,
        CROWDFUNDING_ABI,
        signer
      );

      const contractOwner = await kyc.owner();

      setAccount(address);
      setOwner(contractOwner);
      setKycContract(kyc);
      setCrowdfundingContract(crowdfunding);
      setStatus("✅ Connected to MetaMask");
    } catch (error) {
      console.error(error);
      setStatus("❌ Connection failed");
    }
  };

  // -----------------------------
  // 🔹 Load KYC Requests (Admin)
  // -----------------------------
  const loadKYCRequests = async () => {
    if (!kycContract) return;

    try {
      const events = await kycContract.queryFilter("KYCSubmitted");
      const uniqueUsers = [...new Set(events.map((e) => e.args.user))];

      const data = await Promise.all(
        uniqueUsers.map(async (addr) => {
          const req = await kycContract.kycRequests(addr);
          return {
            user: addr,
            name: req.name,
            cnic: req.cnic,
            status: ["Pending", "Approved", "Rejected"][Number(req.status)],
          };
        })
      );

      setKycRequests(data);
    } catch (err) {
      console.error("Error fetching KYC requests:", err);
    }
  };

  // -----------------------------
  // 🔹 Approve / Reject KYC
  // -----------------------------
  const approveKYC = async (user) => {
    try {
      const tx = await kycContract.approveKYC(user);
      await tx.wait();
      alert(`✅ Approved KYC for ${user}`);
      loadKYCRequests();
    } catch (err) {
      console.error(err);
      alert("❌ Error approving KYC");
    }
  };

  const rejectKYC = async (user) => {
    try {
      const tx = await kycContract.rejectKYC(user);
      await tx.wait();
      alert(`🚫 Rejected KYC for ${user}`);
      loadKYCRequests();
    } catch (err) {
      console.error(err);
      alert("❌ Error rejecting KYC");
    }
  };

  // -----------------------------
  // 🔹 Load Campaigns
  // -----------------------------
  const loadCampaigns = async () => {
    if (!crowdfundingContract) return;

    try {
      const ids = await crowdfundingContract.getCampaignIds();
      if (!ids || ids.length === 0) {
        setCampaigns([]);
        return;
      }

      const campaignData = await Promise.all(
        ids.map(async (id) => {
          const data = await crowdfundingContract.getCampaign(id);
          return {
            id: id.toString(),
            creator: data.creator,
            title: data.title,
            description: data.description,
            goalWei: ethers.formatEther(data.goalWei),
            fundsRaised: ethers.formatEther(data.fundsRaised),
            status: ["Active", "Completed", "Withdrawn"][Number(data.status)],
            createdAt: new Date(Number(data.createdAt) * 1000).toLocaleString(),
          };
        })
      );

      setCampaigns(campaignData);
    } catch (err) {
      console.error("Error loading campaigns:", err);
      setStatus("⚠️ Failed to fetch campaigns — check contract or ABI");
    }
  };

  // -----------------------------
  // 🔹 Auto Load on Init
  // -----------------------------
  useEffect(() => {
    if (crowdfundingContract) loadCampaigns();
    if (kycContract && account === owner) loadKYCRequests();
  }, [crowdfundingContract, kycContract, account, owner]);

  // -----------------------------
  // 🔹 UI
  // -----------------------------
  return (
    <div style={{ textAlign: "center", padding: "30px", fontFamily: "Arial" }}>
      <h1>🚀 Fahad’s Crowdfunding DApp</h1>

      {/* Connect MetaMask */}
      <button
        onClick={connectWallet}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {account ? "Connected" : "Connect MetaMask"}
      </button>

      <p>{status}</p>
      {account && <p>Connected Wallet: {account}</p>}

      {/* KYC Form */}
      <hr />
      <KYCForm />

      {/* Admin Dashboard */}
      {account === owner && (
        <>
          <hr />
          <h2>👑 Admin Dashboard</h2>

          <button onClick={loadKYCRequests} style={{ marginBottom: "10px" }}>
            Refresh KYC Requests
          </button>

          {kycRequests.length === 0 ? (
            <p>No KYC requests yet.</p>
          ) : (
            <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycRequests.map((r) => (
                  <tr key={r.user}>
                    <td>{r.user}</td>
                    <td>{r.name}</td>
                    <td>{r.cnic}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => approveKYC(r.user)}
                            style={{
                              backgroundColor: "green",
                              color: "white",
                              marginRight: "5px",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectKYC(r.user)}
                            style={{
                              backgroundColor: "red",
                              color: "white",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Create Campaign */}
      <hr />
      <h2>🆕 Create a New Campaign</h2>
      <CreateCampaign />

      {/* Campaign List */}
      <hr />
      <h2>📋 Active Campaigns</h2>

      {campaigns.length === 0 ? (
        <p>No campaigns found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {campaigns.map((c) => (
            <li
              key={c.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                margin: "10px auto",
                width: "60%",
                textAlign: "left",
              }}
            >
              <strong>{c.title}</strong>
              <p>{c.description}</p>
              <p>🎯 Goal: {c.goalWei} ETH</p>
              <p>💰 Raised: {c.fundsRaised} ETH</p>
              <p>👤 Creator: {c.creator}</p>
              <p>📅 Created: {c.createdAt}</p>
              <p>Status: {c.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
