import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { KYC_ABI, KYC_CONTRACT_ADDRESS } from "../contractConfig";

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_ABI, provider);

      const requestAddresses = await contract.getKYCRequests();
      const details = await Promise.all(
        requestAddresses.map(async (addr) => {
          const kyc = await contract.getKYC(addr);
          return { address: addr, ...kyc };
        })
      );

      setRequests(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (addr, action) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_ABI, signer);

      const tx =
        action === "approve"
          ? await contract.approveKYC(addr)
          : await contract.rejectKYC(addr);

      await tx.wait();
      setMessage(`✅ ${action.toUpperCase()} successful for ${addr}`);
      await loadRequests();
    } catch (err) {
      console.error(err);
      setMessage("❌ Transaction failed");
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="p-4 border rounded shadow-md mt-4">
      <h2 className="font-bold mb-4">Admin Panel — KYC Requests</h2>
      <button onClick={loadRequests} className="bg-gray-600 text-white px-3 py-1 rounded mb-3">
        Refresh
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        requests.map((r, i) => (
          <div key={i} className="border p-2 mb-2">
            <p><strong>Name:</strong> {r.name}</p>
            <p><strong>CNIC:</strong> {r.cnic}</p>
            <p><strong>Address:</strong> {r.address}</p>
            <p>
              <strong>Status:</strong>{" "}
              {r.approved ? "✅ Approved" : r.rejected ? "❌ Rejected" : "🕓 Pending"}
            </p>

            {!r.approved && !r.rejected && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleAction(r.address, "approve")}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(r.address, "reject")}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

export default AdminPanel;
