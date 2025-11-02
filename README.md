# Crowdfunding-DApp-using-Hardhat-and-React
A decentralized crowdfunding platform where verified users can launch fundraising campaigns and others can contribute using Ether. The DApp uses two smart contracts — KYCRegistry and Crowdfunding — and connect to MetaMask via a React frontend.
This project implements a **Crowdfunding Platform** with integrated **KYC (Know Your Customer)** verification using **Solidity**, **Hardhat**, and a **React frontend**.  
Users must complete and be approved for KYC before creating crowdfunding campaigns.
---
## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v16 or later  
- [MetaMask](https://metamask.io/) browser extension  
- [Hardhat](https://hardhat.org/) (installed automatically with dependencies)

---

## 🧩 Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/Blockchain_asg2.git
cd Blockchain_asg2

2️⃣ Install Dependencies
Backend
cd backend
npm install

Frontend
cd ../client
npm install

🚀 Running the Application
Step 1: Start Local Blockchain
cd backend
npx hardhat node

Step 2: Deploy Smart Contracts
In a new terminal:
cd backend
npx hardhat run scripts/deploy.js --network localhost
Note: Copy the deployed contract addresses printed in the console.

Step 3: Update Frontend Configuration
Open client/src/contractConfig.js and paste the deployed contract addresses:
export const KYC_CONTRACT_ADDRESS = "0x..."; 
export const CROWDFUNDING_CONTRACT_ADDRESS = "0x...";

Step 4: Run Frontend (React App)
In a new terminal:
cd client
npm start

Step 5: Connect MetaMask
Open MetaMask and select Add Network → Localhost 8545.
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Import one of the test account private keys printed by Hardhat.
