import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err)
})

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        username VARCHAR(100) NOT NULL,
        channel_id INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✅ Database schema initialized')
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error)
    throw error
  }
}

export { pool }