const hre = require("hardhat");

async function main() {
  console.log("Deploying PvPAIStaking contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Get platform fee wallet from environment
  const platformFeeWallet = process.env.PLATFORM_FEE_WALLET;
  if (!platformFeeWallet) {
    throw new Error("PLATFORM_FEE_WALLET not set in .env file");
  }

  // Game server address (will be updated later to backend server)
  // For now, use deployer address, then transfer ownership to backend
  const gameServerAddress = deployer.address;

  console.log("Platform fee recipient:", platformFeeWallet);
  console.log("Game server address:", gameServerAddress);

  // Deploy contract
  const PvPAIStaking = await hre.ethers.getContractFactory("PvPAIStaking");
  const contract = await PvPAIStaking.deploy(platformFeeWallet, gameServerAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ PvPAIStaking deployed to:", contractAddress);

  // Get fixed stake amounts
  const [fixedStake, platformFee, gamePot] = await contract.getFixedStake();
  console.log("\nContract Configuration:");
  console.log("Fixed stake amount:", hre.ethers.formatEther(fixedStake), "ETH (~$5)");
  console.log("Platform fee per player:", hre.ethers.formatEther(platformFee), "ETH (~$1)");
  console.log("Game pot per player:", hre.ethers.formatEther(gamePot), "ETH (~$4)");

  // Print important info
  console.log("\n📋 Save these values:");
  console.log("CONTRACT_ADDRESS=", contractAddress);
  console.log("\n⚠️  Important Next Steps:");
  console.log("1. Update Render environment variable:");
  console.log(`   ETH_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. After backend is deployed, update game server address:");
  console.log("   contract.updateGameServer(YOUR_BACKEND_WALLET)");
  console.log("\n3. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${platformFeeWallet} ${gameServerAddress}`);

  // If on testnet, fund the contract for testing
  if (hre.network.name === "sepolia" || hre.network.name === "goerli") {
    console.log("\n🧪 Testnet deployment detected");
    console.log("Get testnet ETH from:");
    console.log("- Sepolia: https://sepoliafaucet.com");
    console.log("- Goerli: https://goerlifaucet.com");
  }

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
