const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const { setupDatabase, query } = require('./database');
const GameManager = require('./game');
const { verifyWalletSignature } = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Initialize blockchain providers
const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const solConnection = new Connection(process.env.SOLANA_RPC_URL);
const baseProvider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const polygonProvider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

// Game manager instance
const gameManager = new GameManager(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.get('/api/lobbies', async (req, res) => {
  try {
    const lobbies = await gameManager.getActiveLobbies();
    res.json({ success: true, lobbies });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lobbies' });
  }
});

app.post('/api/lobby/create', async (req, res) => {
  try {
    const { wallet, chain, stake, signature } = req.body;

    // Verify wallet signature
    const isValid = await verifyWalletSignature(wallet, chain, signature);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    // Verify stake deposit (check blockchain)
    const stakeVerified = await verifyStakeDeposit(wallet, chain, stake);
    if (!stakeVerified) {
      return res.status(400).json({ success: false, error: 'Stake not verified on blockchain' });
    }

    const lobby = await gameManager.createLobby(wallet, chain, stake);
    res.json({ success: true, lobby });
  } catch (error) {
    console.error('Error creating lobby:', error);
    res.status(500).json({ success: false, error: 'Failed to create lobby' });
  }
});

app.post('/api/lobby/join', async (req, res) => {
  try {
    const { lobbyId, wallet, chain, stake, signature } = req.body;

    // Verify wallet signature
    const isValid = await verifyWalletSignature(wallet, chain, signature);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    // Verify stake deposit
    const stakeVerified = await verifyStakeDeposit(wallet, chain, stake);
    if (!stakeVerified) {
      return res.status(400).json({ success: false, error: 'Stake not verified on blockchain' });
    }

    const result = await gameManager.joinLobby(lobbyId, wallet, chain, stake);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error joining lobby:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/player/stats/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const stats = await query(
      'SELECT games_played, games_won, total_wagered, total_won FROM players WHERE wallet = $1',
      [wallet]
    );
    res.json({ success: true, stats: stats.rows[0] || null });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Verify stake deposit on blockchain
async function verifyStakeDeposit(wallet, chain, amount) {
  try {
    // Fixed $5 stake requirement
    const FIXED_STAKE_USD = 5;

    // Check smart contract for stake deposit
    const contractAddress = process.env[`${chain.toUpperCase()}_CONTRACT_ADDRESS`];
    if (!contractAddress) return false;

    if (chain === 'sol') {
      // Verify Solana stake (fixed 0.02 SOL = ~$5)
      const pubkey = new PublicKey(wallet);
      const contract = new PublicKey(contractAddress);
      // Check program account for stake record
      // Verify player deposited exactly the fixed stake amount
      return true; // Placeholder - implement Solana program account check
    } else {
      // Verify EVM chain stake (ETH, Base, Polygon)
      const provider = getProvider(chain);
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function getStake(address) view returns (uint256)',
          'function getFixedStake() view returns (uint256,uint256,uint256)'
        ],
        provider
      );

      // Get fixed stake amount from contract
      const [fixedStake, platformFee, gamePot] = await contract.getFixedStake();

      // Verify player has sufficient stake
      const playerStake = await contract.getStake(wallet);
      return playerStake >= gamePot; // Must have at least $4 available ($1 already went to platform)
    }
  } catch (error) {
    console.error('Error verifying stake:', error);
    return false;
  }
}

function getProvider(chain) {
  switch (chain) {
    case 'eth': return ethProvider;
    case 'base': return baseProvider;
    case 'polygon': return polygonProvider;
    default: return ethProvider;
  }
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', async (data) => {
    const { wallet, chain, signature } = data;
    const isValid = await verifyWalletSignature(wallet, chain, signature);

    if (isValid) {
      socket.wallet = wallet;
      socket.chain = chain;
      socket.emit('authenticated', { success: true });
    } else {
      socket.emit('authenticated', { success: false, error: 'Invalid signature' });
      socket.disconnect();
    }
  });

  socket.on('join_game', async (data) => {
    const { lobbyId } = data;
    await gameManager.addPlayerToGame(lobbyId, socket);
  });

  socket.on('player_move', (data) => {
    if (socket.currentGame) {
      gameManager.handlePlayerMove(socket.currentGame, socket.id, data);
    }
  });

  socket.on('player_shoot', (data) => {
    if (socket.currentGame) {
      gameManager.handlePlayerShoot(socket.currentGame, socket.id, data);
    }
  });

  socket.on('player_rotate', (data) => {
    if (socket.currentGame) {
      gameManager.handlePlayerRotate(socket.currentGame, socket.id, data);
    }
  });

  socket.on('collect_coin', (data) => {
    if (socket.currentGame) {
      gameManager.handleCoinCollection(socket.currentGame, socket.id, data.coinId);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    if (socket.currentGame) {
      await gameManager.handlePlayerDisconnect(socket.currentGame, socket.id);
    }
  });
});

// Initialize database and start server
async function start() {
  try {
    await setupDatabase();
    console.log('Database connected');

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
