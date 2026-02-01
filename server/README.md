# PvP AI Battle Royale - Backend Server

Production-grade backend for real multiplayer crypto battle royale game.

## Features

- **Real-time Multiplayer**: WebSocket server for synchronized gameplay
- **Multi-chain Support**: ETH, Solana, Base, Polygon
- **Smart Contract Integration**: Automated stake deposits and payouts
- **Server-authoritative Game Logic**: Anti-cheat with server-side hit detection
- **PostgreSQL Database**: Persistent lobbies, player stats, game history
- **Wallet Authentication**: Signature-based auth for all chains
- **Rate Limiting**: DDoS protection
- **Security**: Helmet.js, CORS, input validation

## Architecture

```
┌─────────────┐
│   Client    │ (index.html)
│  (Browser)  │
└──────┬──────┘
       │ WebSocket + HTTPS
       ▼
┌─────────────────┐
│  Express API    │ (index.js)
│  Socket.io      │
└────┬────────────┘
     │
     ├──► Game Manager (game.js)
     │    ├─ Lobby system
     │    ├─ Server tick (60 TPS)
     │    ├─ Hit detection
     │    └─ Payout processing
     │
     ├──► Database (database.js)
     │    └─ PostgreSQL
     │
     └──► Smart Contracts
          ├─ Ethereum (PvPAIStaking.sol)
          ├─ Solana (lib.rs)
          ├─ Base (same Solidity)
          └─ Polygon (same Solidity)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb pvpai
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb pvpai
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in all required values:
- Database credentials
- RPC URLs (Alchemy, Infura, QuickNode)
- Smart contract addresses (after deployment)
- Payout wallet private key (use separate wallet with minimal funds)

### 4. Deploy Smart Contracts

**Ethereum/Base/Polygon:**
```bash
cd ../contracts/ethereum
npm install
npx hardhat compile

# Deploy to testnet first
npx hardhat run scripts/deploy.js --network sepolia

# After testing, deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet
npx hardhat run scripts/deploy.js --network base
npx hardhat run scripts/deploy.js --network polygon
```

**Solana:**
```bash
cd ../contracts/solana
anchor build
anchor deploy --provider.cluster devnet  # testnet
anchor deploy --provider.cluster mainnet-beta  # mainnet
```

Update `.env` with deployed contract addresses.

### 5. Run Database Migrations

```bash
cd ../../server
node -e "require('./database').setupDatabase()"
```

### 6. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on port 3000 by default.

## API Endpoints

### Health Check
```
GET /health
Response: { status: 'ok', timestamp: 1234567890 }
```

### Get Active Lobbies
```
GET /api/lobbies
Response: {
  success: true,
  lobbies: [
    {
      id: 'LOBBY-ABC123',
      players: 3,
      maxPlayers: 10,
      totalPot: '0.030',
      status: 'waiting',
      token: 'ETH'
    }
  ]
}
```

### Create Lobby
```
POST /api/lobby/create
Body: {
  wallet: '0x...',
  chain: 'eth',
  stake: 0.01,
  signature: '0x...'
}
Response: {
  success: true,
  lobby: { ... }
}
```

### Join Lobby
```
POST /api/lobby/join
Body: {
  lobbyId: 'LOBBY-ABC123',
  wallet: '0x...',
  chain: 'eth',
  stake: 0.01,
  signature: '0x...'
}
Response: {
  success: true,
  lobby: { ... }
}
```

### Get Player Stats
```
GET /api/player/stats/:wallet
Response: {
  success: true,
  stats: {
    games_played: 10,
    games_won: 3,
    total_wagered: '0.100',
    total_won: '0.250'
  }
}
```

## WebSocket Events

### Client → Server

**authenticate**
```javascript
socket.emit('authenticate', {
  wallet: '0x...',
  chain: 'eth',
  signature: '0x...'
});
```

**join_game**
```javascript
socket.emit('join_game', { lobbyId: 'LOBBY-ABC123' });
```

**player_move**
```javascript
socket.emit('player_move', {
  position: { x: 1, y: 0, z: 5 },
  velocity: { x: 0.1, y: 0, z: 0 }
});
```

**player_shoot**
```javascript
socket.emit('player_shoot', {
  position: { x: 1, y: 1.5, z: 5 },
  direction: { x: 0, y: 0, z: -1 }
});
```

**player_rotate**
```javascript
socket.emit('player_rotate', {
  rotation: { x: 0, y: 1.5 }
});
```

**collect_coin**
```javascript
socket.emit('collect_coin', { coinId: 'abc123' });
```

### Server → Client

**authenticated**
```javascript
socket.on('authenticated', (data) => {
  // { success: true }
});
```

**game_start**
```javascript
socket.on('game_start', (data) => {
  // { playerId, players: [...], gameState: {...} }
});
```

**game_tick** (60 times/second)
```javascript
socket.on('game_tick', (data) => {
  // { players: [...], bullets: [...], coins: [...] }
});
```

**player_shot**
```javascript
socket.on('player_shot', (data) => {
  // { playerId, bulletId, position, direction }
});
```

**player_hit**
```javascript
socket.on('player_hit', (data) => {
  // { damage: 10, health: 90 }
});
```

**player_died**
```javascript
socket.on('player_died', (data) => {
  // { victimId, killerId, coin: {...} }
});
```

**coin_collected**
```javascript
socket.on('coin_collected', (data) => {
  // { coinId, amount: 0.01, total: 0.03 }
});
```

**game_end**
```javascript
socket.on('game_end', (data) => {
  // { winnerId, winnerWallet, totalWinnings: 0.095 }
});
```

## Security Features

### Authentication
- Wallet signature verification for all chains
- Session management with socket IDs
- Rate limiting per IP

### Game Security
- Server-authoritative game state
- Server-side hit detection
- Position validation (anti-teleport)
- Movement speed limits
- Cooldown enforcement

### Smart Contract Security
- ReentrancyGuard on all payable functions
- Pausable for emergency stops
- Multi-sig recommended for ownership
- Platform fee cap (5%)
- Minimum/maximum stake limits

## Production Deployment

### Requirements
- **Server**: 4+ CPU cores, 8GB+ RAM
- **Database**: PostgreSQL 14+
- **Node.js**: 18+
- **OS**: Ubuntu 22.04 LTS recommended

### Docker Deployment

```bash
# Build image
docker build -t pvpai-backend .

# Run container
docker run -d \
  --name pvpai \
  -p 3000:3000 \
  --env-file .env \
  pvpai-backend
```

### AWS/GCP Deployment

1. **Set up VPC and security groups**
2. **Deploy PostgreSQL RDS/Cloud SQL**
3. **Deploy server to EC2/Compute Engine**
4. **Set up load balancer (ALB/Cloud Load Balancing)**
5. **Configure auto-scaling**
6. **Set up CloudWatch/Cloud Monitoring**
7. **Configure backup automation**

### Environment Variables (Production)

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Use managed database
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=pvpai
DB_USER=pvpai_prod
DB_PASSWORD=<strong-password>

# Use Alchemy/Infura/QuickNode for reliability
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<key>
SOLANA_RPC_URL=https://solana-api.projectserum.com
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/<key>

# Deployed contract addresses
ETH_CONTRACT_ADDRESS=0x...
SOL_CONTRACT_ADDRESS=...
BASE_CONTRACT_ADDRESS=0x...
POLYGON_CONTRACT_ADDRESS=0x...

# Use KMS or secrets manager for private keys
PAYOUT_PRIVATE_KEY=<from-kms>
PLATFORM_FEE_WALLET=0x...

# Monitoring
SENTRY_DSN=https://...
DATADOG_API_KEY=...
```

## Monitoring

### Health Checks
```bash
# Server health
curl https://api.yourdomain.com/health

# Database connection
curl https://api.yourdomain.com/api/lobbies
```

### Logs
```bash
# Server logs
pm2 logs pvpai

# Database logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Metrics to Monitor
- Active WebSocket connections
- Server tick rate (should stay at 60 TPS)
- Database query latency
- Failed payout attempts
- Smart contract gas costs
- Player count per lobby
- Game completion rate

## Scaling

### Horizontal Scaling
- Use Redis for session storage (share across servers)
- Implement sticky sessions in load balancer
- Database read replicas for analytics
- Separate game servers by region

### Vertical Scaling
- Increase server resources first
- Optimize database queries (add indexes)
- Use database connection pooling
- Implement caching layer (Redis)

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check firewall rules

### "WebSocket connection failed"
- Ensure CORS configured correctly
- Check firewall allows WebSocket (port 3000)
- Verify SSL certificate for wss://

### "Payout failed"
- Check payout wallet has sufficient gas
- Verify smart contract address
- Check blockchain RPC is responding
- Review failed_payouts table

### "Game lag / low tick rate"
- Check server CPU usage
- Monitor database query times
- Reduce number of players per game
- Optimize game loop logic

## Security Audit Checklist

Before mainnet launch:

- [ ] Smart contracts audited by professional firm
- [ ] Penetration testing completed
- [ ] Rate limiting tested under load
- [ ] All private keys stored in KMS/secrets manager
- [ ] Database backups automated and tested
- [ ] DDoS protection configured
- [ ] SSL/TLS certificates installed
- [ ] Monitoring and alerting active
- [ ] Incident response plan documented
- [ ] Legal review completed

## Support

For production deployment help:
- Security audit: Contact CertiK or OpenZeppelin
- Infrastructure: Hire DevOps consultant
- Smart contracts: Hire experienced Web3 developer

## License

MIT License - Use at your own risk
