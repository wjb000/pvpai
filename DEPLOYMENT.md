# Cloud Deployment Guide - Cheap & Effective Setup

This guide will deploy your backend for **$7/month** (or free with limitations).

## Stack Overview

- **Backend Server:** Render.com ($7/month or free)
- **Database:** Supabase (FREE up to 500MB)
- **Smart Contracts:** Already on blockchain (one-time deployment cost)
- **Frontend:** GitHub Pages or Render static site (FREE)

**Total Monthly Cost: $7** (or $0 on free tier)

---

## Step 1: Set Up Supabase Database (FREE)

### 1.1 Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (free)

### 1.2 Create New Project

1. Click "New Project"
2. Choose a name: `pvpai`
3. Create a strong database password (save it!)
4. Select region: **West US (Oregon)** (same as Render for low latency)
5. Click "Create new project" (takes ~2 minutes)

### 1.3 Get Database Credentials

Once created, go to **Project Settings** → **Database**:

```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your password from step 1.2]
```

Save these! You'll need them.

### 1.4 Run Database Setup

In Supabase dashboard:
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create players table
CREATE TABLE IF NOT EXISTS players (
  wallet VARCHAR(255) PRIMARY KEY,
  chain VARCHAR(20) NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_wagered DECIMAL(20, 8) DEFAULT 0,
  total_won DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id VARCHAR(50) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(50) PRIMARY KEY,
  player_count INTEGER NOT NULL,
  total_pot DECIMAL(20, 8) NOT NULL,
  platform_fee DECIMAL(20, 8) NOT NULL DEFAULT 0,
  winner VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create game_players table
CREATE TABLE IF NOT EXISTS game_players (
  game_id VARCHAR(50) NOT NULL,
  wallet VARCHAR(255) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  stake DECIMAL(20, 8) NOT NULL,
  kills INTEGER DEFAULT 0,
  damage_dealt INTEGER DEFAULT 0,
  coins_collected DECIMAL(20, 8) DEFAULT 0,
  placement INTEGER,
  PRIMARY KEY (game_id, wallet)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(255) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  tx_hash VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  game_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create failed_payouts table
CREATE TABLE IF NOT EXISTS failed_payouts (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(255) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  error TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_game ON transactions(game_id);
```

4. Click **Run** (bottom right)
5. You should see "Success. No rows returned"

**Done!** Your database is ready.

---

## Step 2: Deploy Backend to Render.com

### 2.1 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (free)
3. Authorize Render to access your GitHub

### 2.2 Push Code to GitHub

```bash
cd /Users/sudo/Desktop/pvpai
git add .
git commit -m "Add backend and smart contracts"
git push origin main
```

### 2.3 Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `pvpai`
3. Configure:
   - **Name:** `pvpai-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:**
     - **Free** ($0/month, sleeps after 15 min inactivity) OR
     - **Starter** ($7/month, always on) ← Recommended

### 2.4 Add Environment Variables

In Render dashboard, scroll to **Environment Variables** and add:

```bash
NODE_ENV=production
PORT=3000

# Your frontend URL (update after deploying frontend)
FRONTEND_URL=https://yourdomain.com

# Supabase Database (from Step 1.3)
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password_here

# Blockchain RPC URLs (use free tiers)
ETH_RPC_URL=https://eth.llamarpc.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com

# Smart Contract Addresses (add after deploying contracts)
ETH_CONTRACT_ADDRESS=0x...
SOL_CONTRACT_ADDRESS=...
BASE_CONTRACT_ADDRESS=0x...
POLYGON_CONTRACT_ADDRESS=0x...

# Your personal wallet to receive platform fees ($1 per player)
PLATFORM_FEE_WALLET=0xYourWalletAddressHere

# Payout wallet private key (create a NEW wallet for this!)
# This wallet only needs gas fees, not player funds
PAYOUT_PRIVATE_KEY=0x...
```

**Important Security Notes:**
- Never use your main wallet private key
- Create a separate wallet just for payouts
- Only fund it with gas fees (~$50 worth)
- Use Render's secret variables (they're encrypted)

### 2.5 Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait 2-3 minutes
4. Your backend URL: `https://pvpai-backend.onrender.com`

### 2.6 Test It

```bash
curl https://pvpai-backend.onrender.com/health
```

Should return: `{"status":"ok","timestamp":1234567890}`

---

## Step 3: Deploy Smart Contracts

### 3.1 Get RPC URLs (FREE)

**Option 1: Alchemy (Recommended)**
1. Go to https://www.alchemy.com
2. Sign up free
3. Create app for Ethereum Mainnet
4. Create app for Polygon Mainnet
5. Copy API keys

**Option 2: Use Public RPCs (slower but free)**
- Already configured in Render env vars above

### 3.2 Create Payout Wallet

**IMPORTANT:** Create a NEW wallet just for contract payouts:

```bash
# Install ethers if needed
npm install -g ethers

# Generate new wallet
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

Save both the address and private key securely.

**Fund this wallet:**
- Ethereum: $50 worth of ETH (for gas)
- Base: $10 worth of ETH
- Polygon: $10 worth of MATIC
- Solana: $10 worth of SOL

### 3.3 Deploy Ethereum Contracts

```bash
cd contracts/ethereum
npm install

# Create .env file
cat > .env << EOF
PRIVATE_KEY=0xYourPayoutWalletPrivateKeyHere
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://mainnet.base.org
PLATFORM_FEE_WALLET=0xYourPersonalWalletHere
ETHERSCAN_API_KEY=optional
EOF

# Deploy to testnets FIRST (recommended)
npx hardhat run scripts/deploy.js --network sepolia

# After testing, deploy to mainnets
npx hardhat run scripts/deploy.js --network mainnet
npx hardhat run scripts/deploy.js --network base
npx hardhat run scripts/deploy.js --network polygon
```

Save the deployed contract addresses!

### 3.4 Deploy Solana Program

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

cd ../solana

# Build
anchor build

# Deploy to devnet first (testing)
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta
```

### 3.5 Update Render Environment Variables

Go back to Render dashboard and update:
- `ETH_CONTRACT_ADDRESS`
- `BASE_CONTRACT_ADDRESS`
- `POLYGON_CONTRACT_ADDRESS`
- `SOL_CONTRACT_ADDRESS`

Click **"Save Changes"** - Render will redeploy automatically.

---

## Step 4: Deploy Frontend

### Option 1: Render Static Site (FREE)

1. In Render dashboard: **New +** → **Static Site**
2. Select your GitHub repo
3. Configure:
   - **Name:** `pvpai-frontend`
   - **Build Command:** (leave empty)
   - **Publish Directory:** `.`
4. Click **Create Static Site**

Your frontend URL: `https://pvpai-frontend.onrender.com`

### Option 2: GitHub Pages (FREE)

```bash
# Enable GitHub Pages in repo settings
# Set source to main branch, / (root)
```

Your frontend URL: `https://yourusername.github.io/pvpai`

### 4.2 Update Frontend to Use Backend

I'll need to update `index.html` to connect to your Render backend URL. Let me know your backend URL and I'll update it.

---

## Step 5: Update Frontend Environment

You need to tell me your Render backend URL so I can update the frontend to connect to it.

It will look like: `https://pvpai-backend.onrender.com`

---

## Costs Breakdown

### Free Tier (Limited)
- **Render:** $0 (sleeps after 15min inactivity, slow cold starts)
- **Supabase:** $0 (500MB database, 2GB bandwidth)
- **Total:** $0/month

**Limitations:**
- Server sleeps when inactive (30sec wake-up time)
- Limited concurrent players
- Good for testing only

### Starter Tier (Recommended)
- **Render:** $7/month (always on, 0.5GB RAM)
- **Supabase:** $0 (still free tier)
- **Total:** $7/month

**Supports:**
- ~50 concurrent players
- Multiple simultaneous games
- Always-on, instant response
- Perfect for launch

### Growth Tier (If Popular)
- **Render:** $25/month (2GB RAM, auto-scaling)
- **Supabase:** $25/month (8GB database, priority support)
- **Total:** $50/month

**Supports:**
- 500+ concurrent players
- Many simultaneous games
- High performance
- Scale when you grow

---

## Monitoring

### Check Server Status

```bash
# Health check
curl https://pvpai-backend.onrender.com/health

# Get lobbies
curl https://pvpai-backend.onrender.com/api/lobbies
```

### View Logs

1. Go to Render dashboard
2. Click on `pvpai-backend`
3. Click **Logs** tab
4. Watch real-time server logs

### Database Stats

1. Go to Supabase dashboard
2. Click **Database** → **Tables**
3. See player stats, game history, etc.

---

## Scaling Up

When you get more players:

### More RAM/CPU
1. Render dashboard → Select service
2. Click **Settings** → **Plan**
3. Upgrade to Pro ($25/month for 2GB RAM)

### More Database
1. Supabase dashboard → Settings → Billing
2. Upgrade to Pro ($25/month for 8GB)

### Multiple Regions
- Deploy separate Render services in different regions
- Use load balancer to route players to nearest server

---

## Security Checklist

- [ ] Created separate payout wallet (not your main wallet)
- [ ] Payout wallet only has gas fees (~$50-100)
- [ ] All private keys in Render secrets (not in code)
- [ ] Smart contracts deployed and tested on testnet first
- [ ] Database credentials secure
- [ ] CORS configured correctly (only allow your frontend URL)

---

## Troubleshooting

### "Database connection failed"
- Check Supabase credentials in Render env vars
- Verify database is not paused (Supabase free tier pauses after 7 days inactivity)

### "WebSocket not connecting"
- Render free tier sleeps - upgrade to Starter ($7/month)
- Check CORS in server/index.js allows your frontend URL

### "Smart contract call failed"
- Check payout wallet has gas fees
- Verify contract addresses in Render env vars
- Check blockchain RPC URL is working

### "Server is slow"
- Free tier sleeps - upgrade to Starter
- Cold start takes 30-60 seconds
- Once warm, runs fast

---

## Next Steps

1. Complete Supabase setup (5 minutes)
2. Deploy to Render (10 minutes)
3. Deploy smart contracts (30 minutes)
4. Tell me your backend URL so I can update frontend
5. Test with real money on testnet first
6. Launch! 🚀

---

**Need help?** Let me know which step you're on and I'll assist!
