# Quick Start - Deploy in 30 Minutes

Get your game live for **$7/month** in just 30 minutes!

## Prerequisites

- GitHub account (free)
- Crypto wallet with $100 for smart contract deployment
- Basic terminal knowledge

---

## 🚀 30-Minute Deployment

### Minute 0-5: Database Setup

1. Go to **https://supabase.com** → Sign up (free)
2. Create project: `pvpai`
3. Copy database URL from Settings → Database
4. Go to SQL Editor → Run the SQL from `DEPLOYMENT.md` Step 1.4

✅ **Database ready!**

### Minute 5-15: Backend Deployment

1. Push code to GitHub:
```bash
cd /Users/sudo/Desktop/pvpai
git add .
git commit -m "Deploy backend"
git push origin main
```

2. Go to **https://render.com** → Sign up with GitHub
3. New + → Web Service → Select `pvpai` repo
4. Configure:
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `node index.js`
   - Plan: **Starter ($7/month)**

5. Add Environment Variables (from DEPLOYMENT.md Step 2.4)

6. Click **Create Web Service**

✅ **Backend deploying!** (takes 2-3 minutes)

### Minute 15-25: Smart Contracts

1. Create payout wallet:
```bash
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address, '\nKey:', w.privateKey)"
```

2. Fund payout wallet with gas fees:
   - Send $50 ETH to the address
   - Send $10 MATIC (Polygon)
   - Send $10 ETH (Base)

3. Deploy contracts:
```bash
cd contracts/ethereum
npm install

# Create .env
echo "PRIVATE_KEY=your_payout_wallet_key" > .env
echo "PLATFORM_FEE_WALLET=your_personal_wallet" >> .env

# Deploy (Base is cheapest)
npx hardhat run scripts/deploy.js --network base
```

4. Copy contract address and add to Render env vars

✅ **Smart contracts deployed!**

### Minute 25-30: Frontend Connection

1. Get your Render backend URL: `https://pvpai-backend-xxxx.onrender.com`

2. Tell me the URL and I'll update your frontend to connect to it

3. Push updated frontend:
```bash
git add .
git commit -m "Connect frontend to backend"
git push
```

✅ **Live and ready to play!**

---

## 💰 Cost Summary

**One-time costs:**
- Smart contract deployment: ~$50 (gas fees)

**Monthly costs:**
- Render backend: $7/month (always-on server)
- Supabase database: $0/month (free tier)
- **Total: $7/month**

**Revenue:**
- You get $1 per player
- Need 7 players/month to break even
- 100 players = $100/month profit
- 1000 players = $1000/month profit

---

## ✅ Quick Test

After deployment:

```bash
# Test backend
curl https://your-backend.onrender.com/health

# Test lobbies
curl https://your-backend.onrender.com/api/lobbies
```

Open your game URL and try:
1. Connect wallet
2. Join lobby (testnet first!)
3. Play a game
4. Check if winner gets payout

---

## 🆘 Quick Fixes

**Backend not starting?**
- Check Render logs for errors
- Verify all environment variables set

**Can't connect to database?**
- Check Supabase URL in Render env vars
- Make sure database isn't paused

**Smart contract failing?**
- Check payout wallet has gas fees
- Try Base network (cheapest gas)

---

## Next: Test with Real Money

1. Deploy to testnet first (Sepolia, Base Goerli)
2. Get testnet tokens from faucets
3. Test full game flow
4. Deploy to mainnet
5. Announce launch! 🎉

---

**Ready to deploy?** Follow the steps above or see detailed guide in `DEPLOYMENT.md`.

**Questions?** Drop them in the chat!
