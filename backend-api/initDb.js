const db = require('./config/db');

const initializeDatabase = async () => {
  try {
    console.log('⏳ Creating database tables...');

    const createTablesQuery = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          device_fingerprint VARCHAR(255),
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS forensic_jobs (
          id VARCHAR(100) PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          object_key VARCHAR(500) NOT NULL,
          status VARCHAR(50) DEFAULT 'QUEUED',
          proof_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createTablesQuery);
    console.log('✅ Success! The "users" and "forensic_jobs" tables have been created.');
    process.exit(0); 
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    process.exit(1);
  }
};

initializeDatabase();