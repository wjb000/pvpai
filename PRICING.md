# PvP AI Battle Royale - Pricing Model

## Fixed Entry Fee: $5 per player

### Fee Breakdown

**Each player pays: $5 USD equivalent in crypto**

Split:
- **$1** → Platform fee (pays for backend servers, hosting, maintenance)
- **$4** → Game pot (distributed to players in-game)

### How It Works

1. **Player joins game**
   - Deposits $5 in ETH, SOL, Base, or Polygon
   - $1 immediately goes to platform wallet
   - $4 goes into escrow for the game

2. **During gameplay**
   - Players fight in battle royale
   - When eliminated, their $4 drops as collectible coin
   - Other players can pick up coins
   - Coins accumulate in player's balance

3. **Winner takes all**
   - Last player alive wins
   - Receives all collected coins (their $4 + all eliminated players' $4)
   - Example: 10 players = winner gets $40 (10 × $4)

### Example Scenarios

**2 players:**
- Each pays: $5
- Platform gets: $2 ($1 × 2)
- Game pot: $8 ($4 × 2)
- Winner receives: $8

**5 players:**
- Each pays: $5
- Platform gets: $5 ($1 × 5)
- Game pot: $20 ($4 × 5)
- Winner receives: $20

**10 players (full lobby):**
- Each pays: $5
- Platform gets: $10 ($1 × 10)
- Game pot: $40 ($4 × 10)
- Winner receives: $40

### Crypto Equivalent Values

Amounts are in USD equivalent at time of transaction:

**Ethereum (ETH):**
- If ETH = $2,500: $5 = 0.002 ETH
- Platform fee: 0.0004 ETH ($1)
- Game pot: 0.0016 ETH ($4)

**Solana (SOL):**
- If SOL = $100: $5 = 0.05 SOL
- Platform fee: 0.01 SOL ($1)
- Game pot: 0.04 SOL ($4)

**Base/Polygon:**
- Same as Ethereum (uses ETH equivalent on Base, MATIC on Polygon)

### Platform Revenue Model

With fixed $1 per player:

**Daily (100 games, avg 5 players each):**
- Players: 500
- Platform revenue: $500
- Player payouts: $2,000

**Monthly (3,000 games, avg 5 players each):**
- Players: 15,000
- Platform revenue: $15,000
- Player payouts: $60,000

**Yearly (36,000 games, avg 5 players each):**
- Players: 180,000
- Platform revenue: $180,000
- Player payouts: $720,000

### Why This Model?

**Benefits:**
1. **Simple**: Easy to understand - always $5 to play
2. **Transparent**: Clear fee structure, no hidden costs
3. **Scalable**: Platform fee covers operational costs
4. **Fair**: Winner-takes-all creates high-stakes gameplay
5. **Sustainable**: $1/player covers server costs, development, maintenance

**Comparison to percentage-based fees:**
- Traditional: 5% fee on total pot
  - 10 players × $5 = $50 pot
  - 5% = $2.50 platform fee
  - Winner gets $47.50

- Our model: $1 per player
  - 10 players × $5 = $50 total
  - $10 platform fee ($1 × 10)
  - $40 game pot ($4 × 10)
  - Winner gets $40

**Our model takes higher fee BUT:**
- Covers real operational costs
- Backend servers, database, blockchain gas fees
- 24/7 uptime, security, monitoring
- Smart contract audits
- Customer support

### Gas Fees

**Important:** Players also pay blockchain gas fees:

- **Ethereum mainnet:** ~$5-20 per transaction (high)
- **Base:** ~$0.01-0.10 per transaction (recommended)
- **Polygon:** ~$0.01-0.05 per transaction (recommended)
- **Solana:** ~$0.001-0.01 per transaction (lowest)

**Recommendation:** Use Base, Polygon, or Solana to minimize gas costs.

### Updating Prices

Smart contracts use fixed crypto amounts. To keep $5 USD equivalent:

1. Monitor crypto prices
2. Update contract constants periodically
3. Requires contract upgrade or new deployment
4. Alternative: Use Chainlink price oracles (more complex)

### Terms

- Entry fee is non-refundable once game starts
- If you disconnect/quit early, you forfeit your stake
- Minimum 2 players required to start
- Maximum 10 players per game
- Platform fee collected immediately on deposit
- Winner payouts processed automatically via smart contract
- All transactions recorded on blockchain (transparent)

### Platform Fee Usage

Your $1 platform fee covers:

- **Servers:** AWS/GCP hosting ($1,000/month)
- **Database:** PostgreSQL managed service ($200/month)
- **Blockchain:** Gas fees for payouts ($500/month)
- **Monitoring:** Datadog, Sentry ($300/month)
- **Development:** Bug fixes, features ($5,000/month)
- **Security:** Audits, maintenance ($2,000/month)
- **Support:** Customer service ($1,000/month)

**Total operational cost:** ~$10,000/month
**Required players/month:** 10,000 (achievable with marketing)

### Fair Play Guarantee

- Server-authoritative game logic (no client-side cheating)
- All hits validated on server
- Movement and shooting cooldowns enforced
- Smart contracts audited for security
- All transactions verifiable on blockchain

---

**Questions?** Check the FAQ or contact support.
