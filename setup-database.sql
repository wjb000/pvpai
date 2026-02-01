-- PvP AI Database Setup
-- Run this in Supabase SQL Editor

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
