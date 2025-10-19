import React, { useState } from "react";
import { ethers } from "ethers";
import { KYC_ABI, KYC_CONTRACT_ADDRESS } from "../contractConfig";

const KYCForm = () => {
  const [name, setName] = useState("");
  const [cnic, setCnic] = useState("");
  const [message, setMessage] = useState("");

  const submitKYC = async () => {
    if (!window.ethereum) {
      alert("Please connect MetaMask");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(KYC_CONTRACT_ADDRESS, KYC_ABI, signer);

      const tx = await contract.submitKYCRequest(name, cnic);
      await tx.wait();
      setMessage("✅ KYC submitted successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error submitting KYC");
    }
  };

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="font-bold mb-2">Submit KYC</h2>
      <input
        placeholder="Full Name"
        className="border p-2 mb-2 w-full"
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="CNIC"
        className="border p-2 mb-2 w-full"
        onChange={(e) => setCnic(e.target.value)}
      />
      <button onClick={submitKYC} className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

export default KYCForm;
