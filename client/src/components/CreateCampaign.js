import React, { useState } from "react";
import { ethers } from "ethers";
import { CROWDFUNDING_CONTRACT_ADDRESS, CROWDFUNDING_ABI } from "../contractConfig";

const CreateCampaign = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");

  const createCampaign = async () => {
    if (!window.ethereum) {
      alert("Please connect MetaMask");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CROWDFUNDING_CONTRACT_ADDRESS, CROWDFUNDING_ABI, signer);

      const goalWei = ethers.parseEther(goal);
      const tx = await contract.createCampaign(title, description, goalWei);
      await tx.wait();

      setMessage("✅ Campaign created successfully!");
      setTitle("");
      setDescription("");
      setGoal("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error creating campaign");
    }
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto">
      <input
        placeholder="Campaign Title"
        className="border p-2 mb-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        className="border p-2 mb-2 w-full"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        placeholder="Goal (in ETH)"
        className="border p-2 mb-2 w-full"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <button
        onClick={createCampaign}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Create Campaign
      </button>
      {message && <p className="mt-2 text-center">{message}</p>}
    </div>
  );
};

export default CreateCampaign;
