# Render Setup Instructions

## File Location
The `.env` file is at: `/Users/sudo/Desktop/pvpai/.env`

---

## What You Need To Change RIGHT NOW:

### 1. `PLATFORM_FEE_WALLET`
**Change this line:**
```
PLATFORM_FEE_WALLET=0xYOUR_WALLET_ADDRESS_HERE
```

**To your MetaMask/Coinbase wallet address:**
```
PLATFORM_FEE_WALLET=0xYourActualWalletAddress
```

This is where you'll receive **$1 per player**!

---

## What You Can Leave For Later:

### `PAYOUT_PRIVATE_KEY`
This needs a NEW wallet (not your main wallet). We'll set this up after backend is deployed.

### Contract Addresses
These will be added after you deploy smart contracts.

---

## How To Use This File:

1. Open `/Users/sudo/Desktop/pvpai/.env` in any text editor
2. Change `PLATFORM_FEE_WALLET` to your real wallet address
3. Save the file
4. Copy the ENTIRE file content
5. In Render, click "Add from .env"
6. Paste everything
7. Click "Import"

---

## Example of What It Should Look Like:

```env
PLATFORM_FEE_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

(But with YOUR wallet address)

---

**Tell me when you've updated your wallet address and I'll help you deploy!**
