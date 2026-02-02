# PvP AI - Project Status & Documentation

**Last Updated:** 2026-02-01
**Current Status:** Prototype Complete - Ready for Smart Contract Integration

---

## 🎮 Project Overview

Crypto-powered Battle Royale game where players:
- Stake crypto (Solana SOL or Base ETH) to enter matches
- Battle other players in real-time 3D combat
- Winner takes the pot (minus 20% platform fee: $1 platform + $4 game pot from $5 entry)
- Support for AI bots using Claude/OpenAI APIs

**Tech Stack:**
- Frontend: Three.js, WebGL, HTML5
- Backend: Node.js, Express, Socket.io
- Database: Neon PostgreSQL (Serverless)
- Deployment: Render (Backend), GitHub Pages (Frontend)

---

## 🔗 Backend Infrastructure

### Backend URL
```
https://pvpai-backend.onrender.com
```

### Neon PostgreSQL Database
**Connection Details:**
- Host: `ep-holy-sun-affjkw27-pooler.c-2.us-west-2.aws.neon.tech`
- Port: `5432`
- Database: `neondb`
- User: `neondb_owner`
- Password: `npg_CMZOad2yA3Ts`
- SSL: Required (rejectUnauthorized: false)

**Location:** `/server/database.js`

### Database Schema

#### Tables:
1. **players** - Player profiles and stats
   - wallet (PK), chain, games_played, games_won, total_wagered, total_won

2. **lobbies** - Game lobbies
   - id (PK), status, created_at, started_at, ended_at

3. **games** - Completed games
   - id (PK), player_count, total_pot, platform_fee, winner, status

4. **game_players** - Player participation in games
   - game_id, wallet (composite PK), chain, stake, kills, damage_dealt, coins_collected, placement

5. **transactions** - All financial transactions
   - id (PK), wallet, chain, type, amount, tx_hash, status, game_id

6. **failed_payouts** - Track failed payouts for retry
   - id (PK), wallet, chain, amount, error, resolved

---

## 🔐 Blockchain Configuration

### Supported Chains
**Solana:**
- Token: SOL
- Stake: 0.05 SOL (~$5 USD)
- Wallet: Phantom

**Base:**
- Token: ETH
- Stake: 0.002 ETH (~$5 USD)
- Wallets: MetaMask, Coinbase Wallet

### Wallet Integration

**Phantom (Solana):**
```javascript
window.solana.connect()
// Returns: { publicKey }
```

**MetaMask (Base):**
```javascript
window.ethereum.request({ method: 'eth_requestAccounts' })
// Returns: [address]
```

**Coinbase Wallet (Base):**
```javascript
window.ethereum.request({ method: 'eth_requestAccounts' })
// Check: window.ethereum.isCoinbaseWallet
```

---

## 📁 Key Files

### Frontend
- **index.html** - Main game file (26k+ lines, all-in-one)
  - Three.js game engine
  - Wallet connection logic
  - Game mechanics (shooting, movement, health)
  - UI/dashboard

- **config.js** - Configuration
  - Backend URL
  - Fixed stake amounts
  - Chain settings

- **backend-connector.js** - Backend API wrapper
  - Socket.io connection
  - Lobby management functions
  - Player actions (move, shoot, collect)

### Backend (server/)
- **database.js** - PostgreSQL connection and setup
- **server.js** - Main backend server (to be created)
- **routes/** - API endpoints (to be created)
- **socket/** - WebSocket handlers (to be created)

---

## ✅ Implemented Features

### Game Mechanics
- ✅ Third-person 3D camera with zoom (mouse wheel)
- ✅ WASD movement + Shift sprint (0.15 speed, 2x multiplier)
- ✅ Spacebar jump with gravity physics
- ✅ Cursor-based shooting (no pointer lock)
- ✅ Crosshair follows mouse cursor
- ✅ Gun positioned in robot's right hand
- ✅ Gun tracks cursor for aiming
- ✅ Accurate bullet trajectory with raycasting
- ✅ Recoil animation on shooting
- ✅ Health system (100 HP, 10 damage per hit)
- ✅ Health bar UI at top of screen
- ✅ Kill feed notifications
- ✅ Animated environment particles (500 particles with sparkle)

### Visual Features
- ✅ RobotExpressive 3D model with animations (Idle, Walk, Run)
- ✅ Custom robot colors (color wheel selector)
- ✅ Futuristic gun model with red glow accents
- ✅ Loot boxes with rarity tiers (Gold/Purple/Green/Orange)
- ✅ Hovering loot box animations
- ✅ Circular platform with 33.75 radius boundary
- ✅ Bloom post-processing effects

### Multiplayer (Prototype)
- ✅ Lobby system UI
- ✅ Create/join game interface
- ✅ Backend connector functions
- ✅ Socket.io event structure
- ⚠️ Real multiplayer requires backend deployment

### Wallet/Blockchain
- ✅ Phantom wallet integration (Solana)
- ✅ MetaMask wallet integration (Base)
- ✅ Coinbase Wallet integration (Base)
- ✅ Chain selector (Solana/Base only)
- ✅ AI bot mode with API key input
- ⚠️ Smart contracts not yet implemented

---

## 🚧 Next Steps (In Priority Order)

### 1. Deploy Backend Server
**File:** Create `/server/server.js`
```javascript
// Required:
- Express app setup
- Socket.io server
- CORS for frontend domain
- Database connection
- Health check endpoint
```

**Deploy to Render:**
- Connect GitHub repo
- Set environment variables (DATABASE_URL)
- Auto-deploy on push

### 2. Implement Smart Contracts

**Solana (Anchor Framework):**
```rust
// Programs needed:
- Escrow program for stake holding
- Game manager program
- Payout distribution program
```

**Base (Solidity):**
```solidity
// Contracts needed:
- StakeManager.sol - Hold stakes in escrow
- GameManager.sol - Manage game state
- PayoutDistributor.sol - Winner payouts
```

### 3. Backend API Endpoints

**REST APIs:**
- `POST /api/lobbies/create` - Create new lobby
- `POST /api/lobbies/join` - Join existing lobby
- `GET /api/lobbies` - List active lobbies
- `GET /api/player/:wallet` - Get player stats
- `POST /api/transaction/verify` - Verify blockchain transaction

**Socket.io Events:**
- `authenticate` - Player authentication
- `join_game` - Join game lobby
- `player_move` - Player movement sync
- `player_rotate` - Player rotation sync
- `player_shoot` - Shooting action
- `collect_coin` - Coin collection
- `player_hit` - Damage event
- `player_death` - Player elimination
- `game_end` - Game completion

### 4. Smart Contract Integration Points

**In index.html (around line 1400):**
```javascript
// Before createGame():
1. Call smart contract to stake tokens
2. Wait for transaction confirmation
3. Get transaction hash
4. Send to backend with lobby creation

// After game ends (showVictory function):
1. Backend verifies winner
2. Call smart contract for payout
3. Transfer winnings to winner wallet
4. Update database with transaction
```

### 5. Security & Production Readiness

**Required:**
- [ ] Signature verification for wallet authentication
- [ ] Rate limiting on API endpoints
- [ ] Anti-cheat validation (server-side hit detection)
- [ ] Transaction replay attack prevention
- [ ] Secure WebSocket connections (wss://)
- [ ] Input sanitization
- [ ] CSRF protection

---

## 💻 Code Locations Reference

### Shooting System
- Gun creation: `index.html:1744-1853`
- Shoot function: `index.html:1960-2031`
- Bullet updates: `index.html:2373-2382`
- Gun tracking: `index.html:2344-2367`
- Hit detection: `index.html:2033-2068`

### Movement System
- Input handlers: `index.html:1907-1952`
- Movement logic: `index.html:2241-2282`
- Jump physics: `index.html:2384-2393`
- Animation system: `index.html:2284-2338`

### Wallet Connection
- selectChain: `index.html:1174-1179`
- connectWallet: `index.html:1181-1218`
- Phantom integration: `index.html:1199-1204`
- MetaMask integration: `index.html:1188-1197`
- Coinbase integration: `index.html:1206-1224`

### Game State
- State object: `index.html:1140-1156`
- Health bar: `index.html:2232-2239`
- Victory screen: `index.html:2205-2222`

### Loot System
- Drop coins: `index.html:2070-2179`
- Coin collection: `index.html:2181-2203`
- Loot animations: `index.html:2412-2430`

---

## 🌐 Environment Variables Needed

### Backend (Render)
```env
DATABASE_URL=postgresql://neondb_owner:npg_CMZOad2yA3Ts@ep-holy-sun-affjkw27-pooler.c-2.us-west-2.aws.neon.tech:5432/neondb
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
BASE_RPC_URL=https://mainnet.base.org
```

### Frontend (GitHub Pages or Vercel)
```env
BACKEND_URL=https://pvpai-backend.onrender.com
```

---

## 📊 Game Economics

**Entry Fee:** $5 USD fixed
- **Platform Fee:** $1 (20%)
- **Game Pot:** $4 (80%)

**Example 10-player game:**
- Total pot: $50
- Platform takes: $10
- Winner receives: $40

**Stake Amounts:**
- Solana: 0.05 SOL ≈ $5 (update based on price)
- Base: 0.002 ETH ≈ $5 (update based on price)

---

## 🔧 Development Commands

### Local Testing
```bash
# Open game locally
open index.html

# Start backend (once created)
cd server
node server.js
```

### Git Operations
```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Your message"

# Push to GitHub
git push origin main
```

### Database Management
```bash
# Connect to Neon PostgreSQL (requires neonctl)
npx neonctl sql-editor

# Or use psql
psql postgresql://neondb_owner:npg_CMZOad2yA3Ts@ep-holy-sun-affjkw27-pooler.c-2.us-west-2.aws.neon.tech:5432/neondb
```

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **No Real Multiplayer** - Fake AI players only, needs backend deployment
2. **No Smart Contracts** - Payment system not implemented
3. **Client-Side Logic** - Game state can be manipulated (needs server authority)
4. **No Anticheat** - All validation is client-side
5. **Gun Model** - Simple geometric shapes (could use proper 3D model)

### Future Improvements
- [ ] Add proper 3D gun model (GLTF)
- [ ] Server-authoritative game state
- [ ] Matchmaking system
- [ ] Ranked/casual modes
- [ ] Player progression/stats tracking
- [ ] In-game purchases (skins, emotes)
- [ ] Spectator mode
- [ ] Replay system
- [ ] Mobile support (touch controls)

---

## 📞 Important Links

**Repository:** https://github.com/wjb000/pvpai
**Backend:** https://pvpai-backend.onrender.com
**Database:** Neon PostgreSQL Console

**Documentation:**
- Three.js: https://threejs.org/docs/
- Socket.io: https://socket.io/docs/
- Anchor (Solana): https://www.anchor-lang.com/
- Base Network: https://docs.base.org/

---

## 📝 Notes from Development

### Animation System
- RobotExpressive model animations: 'Idle', 'Walking', 'Running' (case-sensitive)
- Use `isScheduled()` and `paused` to check animation state (not `isRunning()`)

### Movement Implementation
- Copied exact values from /Users/sudo/Desktop/site/index.html
- Speed: 0.15, Sprint: 2x, Rotation: 0.15 lerp
- Camera: Fixed offset (0, 10, 15), lerp 0.05
- Platform radius: 33.75 units

### Shooting Mechanics
- Raycasting from camera through cursor for accurate aiming
- Gun tracks cursor in real-time (animate loop)
- Bullets spawn from gun barrel world position
- Bullet speed: 2.0 units/frame
- Cooldown: 15 frames (~0.25 seconds at 60fps)

### Wallet Integration
- Phantom: window.solana API
- MetaMask/Coinbase: window.ethereum API
- Chain verification via eth_chainId
- Signature verification needed for production

---

## ✨ Recent Changes (Latest Commit)

**Commit:** 2f17adc - "Fix shooting mechanics, gun positioning, and limit to Solana/Base chains"

Changes:
- Fixed gun positioning in robot's right hand
- Improved bullet trajectory with proper raycasting
- Added dynamic gun aiming that tracks cursor
- Crosshair now follows mouse cursor
- Limited chains to Solana and Base only
- Default chain set to Solana
- Implemented Coinbase Wallet support
- Removed Ethereum and Polygon options

---

**Ready to continue development!** Start with deploying the backend server to Render, then implement smart contracts for Solana and Base.
