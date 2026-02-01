const { query } = require('./database');
const { ethers } = require('ethers');
const crypto = require('crypto');

class GameManager {
  constructor(io) {
    this.io = io;
    this.games = new Map(); // gameId -> Game instance
    this.lobbies = new Map(); // lobbyId -> Lobby data
    this.playerToGame = new Map(); // socketId -> gameId
  }

  async createLobby(wallet, chain, stake) {
    const lobbyId = 'LOBBY-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const lobby = {
      id: lobbyId,
      players: [{
        wallet,
        chain,
        stake,
        ready: false
      }],
      maxPlayers: 10,
      status: 'waiting',
      createdAt: Date.now()
    };

    this.lobbies.set(lobbyId, lobby);

    // Save to database
    await query(
      'INSERT INTO lobbies (id, status, created_at) VALUES ($1, $2, $3)',
      [lobbyId, 'waiting', new Date()]
    );

    this.broadcastLobbyUpdate();
    return lobby;
  }

  async joinLobby(lobbyId, wallet, chain, stake) {
    const lobby = this.lobbies.get(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      throw new Error('Lobby is full');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Game already started');
    }

    // Check if wallet already in lobby
    if (lobby.players.some(p => p.wallet === wallet)) {
      throw new Error('Already in this lobby');
    }

    lobby.players.push({
      wallet,
      chain,
      stake,
      ready: false
    });

    // Auto-start if lobby is full
    if (lobby.players.length >= 2) {
      lobby.status = 'starting';
      setTimeout(() => this.startGame(lobbyId), 5000);
    }

    this.broadcastLobbyUpdate();
    return { lobby };
  }

  async startGame(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return;

    lobby.status = 'in_progress';

    const game = new Game(lobbyId, lobby.players, this.io);
    this.games.set(lobbyId, game);

    // Update database
    await query(
      'UPDATE lobbies SET status = $1, started_at = $2 WHERE id = $3',
      ['in_progress', new Date(), lobbyId]
    );

    // Record game in database
    const totalPot = lobby.players.reduce((sum, p) => sum + p.stake, 0);
    await query(
      'INSERT INTO games (id, player_count, total_pot, status) VALUES ($1, $2, $3, $4)',
      [lobbyId, lobby.players.length, totalPot, 'in_progress']
    );

    this.broadcastLobbyUpdate();
    game.start();
  }

  async addPlayerToGame(lobbyId, socket) {
    const game = this.games.get(lobbyId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    game.addPlayer(socket);
    this.playerToGame.set(socket.id, lobbyId);
    socket.currentGame = lobbyId;
  }

  handlePlayerMove(gameId, socketId, data) {
    const game = this.games.get(gameId);
    if (game) {
      game.handleMove(socketId, data);
    }
  }

  handlePlayerShoot(gameId, socketId, data) {
    const game = this.games.get(gameId);
    if (game) {
      game.handleShoot(socketId, data);
    }
  }

  handlePlayerRotate(gameId, socketId, data) {
    const game = this.games.get(gameId);
    if (game) {
      game.handleRotate(socketId, data);
    }
  }

  handleCoinCollection(gameId, socketId, coinId) {
    const game = this.games.get(gameId);
    if (game) {
      game.handleCoinCollection(socketId, coinId);
    }
  }

  async handlePlayerDisconnect(gameId, socketId) {
    const game = this.games.get(gameId);
    if (game) {
      await game.handleDisconnect(socketId);
    }
    this.playerToGame.delete(socketId);
  }

  async getActiveLobbies() {
    return Array.from(this.lobbies.values())
      .filter(l => l.status === 'waiting' || l.status === 'starting')
      .map(l => ({
        id: l.id,
        players: l.players.length,
        maxPlayers: l.maxPlayers,
        status: l.status,
        totalPot: l.players.reduce((sum, p) => sum + p.stake, 0).toFixed(4)
      }));
  }

  broadcastLobbyUpdate() {
    this.io.emit('lobbies_update', { lobbies: Array.from(this.lobbies.values()) });
  }

  async endGame(gameId, winnerId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const lobby = this.lobbies.get(gameId);
    if (!lobby) return;

    const winner = game.players.get(winnerId);

    // Each player paid $5, $1 already went to platform, $4 per player in pot
    const playersCount = lobby.players.length;
    const gamePotPerPlayer = 4; // $4 in game
    const platformFeePerPlayer = 1; // $1 already collected
    const totalPot = playersCount * gamePotPerPlayer;
    const totalPlatformFees = playersCount * platformFeePerPlayer;
    const winnings = totalPot; // Winner gets all $4 per player

    // Update database
    await query(
      'UPDATE games SET status = $1, winner = $2, platform_fee = $3, ended_at = $4 WHERE id = $5',
      ['completed', winner.wallet, totalPlatformFees, new Date(), gameId]
    );

    // Update player stats
    await query(
      'UPDATE players SET games_played = games_played + 1, games_won = games_won + 1, total_won = total_won + $1 WHERE wallet = $2',
      [winnings, winner.wallet]
    );

    console.log(`Game ${gameId} ended. Winner: ${winner.wallet}`);
    console.log(`Winnings: $${winnings} (${playersCount} players × $4 each)`);
    console.log(`Platform earned: $${totalPlatformFees} (${playersCount} players × $1 each)`);

    // Trigger payout from smart contract
    await this.processPayout(winner.wallet, winner.chain, winnings);

    // Clean up
    this.games.delete(gameId);
    this.lobbies.delete(gameId);
    this.broadcastLobbyUpdate();
  }

  async processPayout(wallet, chain, amount) {
    try {
      // Call smart contract to release winnings
      // Note: Platform fees ($1 per player) already collected on deposit
      const contractAddress = process.env[`${chain.toUpperCase()}_CONTRACT_ADDRESS`];
      const privateKey = process.env.PAYOUT_PRIVATE_KEY;

      if (chain === 'sol') {
        // Solana payout logic
        // Use Solana program to transfer winnings
        console.log(`Processing Solana payout: ${amount} SOL to ${wallet}`);
        // Winner receives entire pot (platform fees already taken)
      } else {
        // EVM chain payout (ETH, Base, Polygon)
        const provider = this.getProvider(chain);
        const wallet_signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(
          contractAddress,
          ['function payout(bytes32 gameId, address winner) external'],
          wallet_signer
        );

        // Convert game ID to bytes32
        const gameIdBytes32 = ethers.id(wallet); // Use wallet as game identifier

        const tx = await contract.payout(gameIdBytes32, wallet);
        await tx.wait();
        console.log(`Payout processed: ${amount} ${chain} to ${wallet}`);
        console.log(`Platform already received $1 per player on deposit`);
      }
    } catch (error) {
      console.error('Payout failed:', error);
      // Log to database for manual review
      await query(
        'INSERT INTO failed_payouts (wallet, chain, amount, error) VALUES ($1, $2, $3, $4)',
        [wallet, chain, amount, error.message]
      );
    }
  }

  getProvider(chain) {
    // Return appropriate provider based on chain
    // Implementation in main server file
  }
}

class Game {
  constructor(id, lobbyPlayers, io) {
    this.id = id;
    this.io = io;
    this.players = new Map(); // socketId -> player data
    this.lobbyPlayers = lobbyPlayers;
    this.gameState = {
      coins: [],
      bullets: [],
      alivePlayers: 0
    };
    this.tickRate = 60; // Server tick rate (60 TPS)
    this.tickInterval = null;
  }

  start() {
    console.log(`Game ${this.id} started with ${this.lobbyPlayers.length} players`);
    this.tickInterval = setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  addPlayer(socket) {
    const lobbyPlayer = this.lobbyPlayers.find(p => p.wallet === socket.wallet);
    if (!lobbyPlayer) return;

    const spawnPos = this.getSpawnPosition(this.players.size);

    const player = {
      id: socket.id,
      socket,
      wallet: socket.wallet,
      chain: socket.chain,
      stake: lobbyPlayer.stake,
      position: spawnPos,
      rotation: { x: 0, y: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      health: 100,
      maxHealth: 100,
      ammo: 30,
      maxAmmo: 30,
      kills: 0,
      collected: 0,
      alive: true
    };

    this.players.set(socket.id, player);
    this.gameState.alivePlayers++;

    // Send initial game state to player
    socket.emit('game_start', {
      playerId: socket.id,
      players: this.getPlayerStates(),
      gameState: this.gameState
    });

    // Notify other players
    socket.to(this.id).emit('player_joined', this.getPlayerState(player));
  }

  tick() {
    // Server-authoritative game loop

    // Update bullets
    this.gameState.bullets = this.gameState.bullets.filter(bullet => {
      bullet.position.x += bullet.velocity.x;
      bullet.position.y += bullet.velocity.y;
      bullet.position.z += bullet.velocity.z;
      bullet.life--;

      if (bullet.life <= 0) return false;

      // Server-side hit detection
      for (const [socketId, player] of this.players) {
        if (!player.alive || socketId === bullet.shooterId) continue;

        const dist = this.distance(bullet.position, player.position);
        if (dist < 1.5) {
          this.handleHit(socketId, bullet.shooterId, 10);
          return false;
        }
      }

      return true;
    });

    // Broadcast game state to all players
    this.io.to(this.id).emit('game_tick', {
      players: this.getPlayerStates(),
      bullets: this.gameState.bullets,
      coins: this.gameState.coins
    });
  }

  handleMove(socketId, data) {
    const player = this.players.get(socketId);
    if (!player || !player.alive) return;

    // Server validates and applies movement
    player.position = this.validatePosition(data.position);
    player.velocity = data.velocity;
  }

  handleRotate(socketId, data) {
    const player = this.players.get(socketId);
    if (!player || !player.alive) return;

    player.rotation = data.rotation;
  }

  handleShoot(socketId, data) {
    const player = this.players.get(socketId);
    if (!player || !player.alive) return;

    if (player.ammo <= 0) {
      player.socket.emit('reload_start');
      setTimeout(() => {
        player.ammo = player.maxAmmo;
        player.socket.emit('reload_complete');
      }, 2000);
      return;
    }

    player.ammo--;

    // Create server-authoritative bullet
    const bullet = {
      id: crypto.randomBytes(4).toString('hex'),
      shooterId: socketId,
      position: { ...data.position },
      velocity: data.direction,
      life: 60
    };

    this.gameState.bullets.push(bullet);

    // Broadcast shoot event
    this.io.to(this.id).emit('player_shot', {
      playerId: socketId,
      bulletId: bullet.id,
      position: bullet.position,
      direction: bullet.velocity
    });
  }

  handleHit(victimId, shooterId, damage) {
    const victim = this.players.get(victimId);
    const shooter = this.players.get(shooterId);

    if (!victim || !victim.alive) return;

    victim.health -= damage;

    // Notify victim
    victim.socket.emit('player_hit', { damage, health: victim.health });

    // Broadcast health update
    this.io.to(this.id).emit('player_health', {
      playerId: victimId,
      health: victim.health
    });

    if (victim.health <= 0) {
      this.handlePlayerDeath(victimId, shooterId);
    }
  }

  handlePlayerDeath(victimId, killerId) {
    const victim = this.players.get(victimId);
    const killer = this.players.get(killerId);

    if (!victim) return;

    victim.alive = false;
    this.gameState.alivePlayers--;

    if (killer) {
      killer.kills++;
    }

    // Drop coins
    const coin = {
      id: crypto.randomBytes(4).toString('hex'),
      playerId: victimId,
      wallet: victim.wallet,
      amount: victim.stake + victim.collected,
      position: { ...victim.position }
    };

    this.gameState.coins.push(coin);

    // Broadcast death
    this.io.to(this.id).emit('player_died', {
      victimId,
      killerId,
      coin
    });

    // Check win condition
    if (this.gameState.alivePlayers === 1) {
      this.endGame();
    }
  }

  handleCoinCollection(socketId, coinId) {
    const player = this.players.get(socketId);
    const coinIndex = this.gameState.coins.findIndex(c => c.id === coinId);

    if (!player || !player.alive || coinIndex === -1) return;

    const coin = this.gameState.coins[coinIndex];

    // Verify proximity
    const dist = this.distance(player.position, coin.position);
    if (dist > 2) return;

    player.collected += coin.amount;
    this.gameState.coins.splice(coinIndex, 1);

    // Notify player
    player.socket.emit('coin_collected', {
      coinId,
      amount: coin.amount,
      total: player.collected
    });

    // Broadcast collection
    this.io.to(this.id).emit('coin_removed', { coinId });
  }

  async handleDisconnect(socketId) {
    const player = this.players.get(socketId);
    if (!player) return;

    // Treat disconnect as death
    if (player.alive) {
      this.handlePlayerDeath(socketId, null);
    }

    this.players.delete(socketId);
  }

  async endGame() {
    // Find winner
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    if (alivePlayers.length !== 1) return;

    const winner = alivePlayers[0];

    // Broadcast victory
    this.io.to(this.id).emit('game_end', {
      winnerId: winner.id,
      winnerWallet: winner.wallet,
      totalWinnings: winner.stake + winner.collected
    });

    // Stop game loop
    clearInterval(this.tickInterval);

    // Trigger payout
    const gameManager = require('./index').gameManager;
    await gameManager.endGame(this.id, winner.id);
  }

  getSpawnPosition(index) {
    const angle = (index / 10) * Math.PI * 2;
    const radius = 15;
    return {
      x: Math.cos(angle) * radius,
      y: 1,
      z: Math.sin(angle) * radius
    };
  }

  validatePosition(position) {
    // Ensure player stays on platform
    const maxRadius = 20;
    const dist = Math.sqrt(position.x ** 2 + position.z ** 2);

    if (dist > maxRadius) {
      const angle = Math.atan2(position.z, position.x);
      position.x = Math.cos(angle) * maxRadius;
      position.z = Math.sin(angle) * maxRadius;
    }

    return position;
  }

  distance(pos1, pos2) {
    return Math.sqrt(
      (pos1.x - pos2.x) ** 2 +
      (pos1.y - pos2.y) ** 2 +
      (pos1.z - pos2.z) ** 2
    );
  }

  getPlayerState(player) {
    return {
      id: player.id,
      wallet: player.wallet,
      position: player.position,
      rotation: player.rotation,
      health: player.health,
      alive: player.alive,
      kills: player.kills
    };
  }

  getPlayerStates() {
    return Array.from(this.players.values()).map(p => this.getPlayerState(p));
  }
}

module.exports = GameManager;
