const { Pool } = require('pg');

// Use connection pooler for Supabase (IPv4 compatible)
const isSupabase = process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co');
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: isSupabase ? 6543 : (process.env.DB_PORT || 5432), // Use pooler port 6543 for Supabase
  database: process.env.DB_NAME || 'pvpai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

const pool = new Pool(connectionConfig);

async function setupDatabase() {
  const client = await pool.connect();

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        wallet VARCHAR(255) PRIMARY KEY,
        chain VARCHAR(20) NOT NULL,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        total_wagered DECIMAL(20, 8) DEFAULT 0,
        total_won DECIMAL(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lobbies (
        id VARCHAR(50) PRIMARY KEY,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        ended_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(50) PRIMARY KEY,
        player_count INTEGER NOT NULL,
        total_pot DECIMAL(20, 8) NOT NULL,
        platform_fee DECIMAL(20, 8) NOT NULL DEFAULT 0,
        winner VARCHAR(255),
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        FOREIGN KEY (winner) REFERENCES players(wallet)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_players (
        game_id VARCHAR(50) NOT NULL,
        wallet VARCHAR(255) NOT NULL,
        chain VARCHAR(20) NOT NULL,
        stake DECIMAL(20, 8) NOT NULL,
        kills INTEGER DEFAULT 0,
        damage_dealt INTEGER DEFAULT 0,
        coins_collected DECIMAL(20, 8) DEFAULT 0,
        placement INTEGER,
        PRIMARY KEY (game_id, wallet),
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (wallet) REFERENCES players(wallet)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet VARCHAR(255) NOT NULL,
        chain VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        tx_hash VARCHAR(255),
        status VARCHAR(20) NOT NULL,
        game_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet) REFERENCES players(wallet),
        FOREIGN KEY (game_id) REFERENCES games(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS failed_payouts (
        id SERIAL PRIMARY KEY,
        wallet VARCHAR(255) NOT NULL,
        chain VARCHAR(20) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        error TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_game ON transactions(game_id)
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

module.exports = {
  query,
  setupDatabase,
  pool
};
