import { query } from './pool.js';
import { logger } from '../utils/logger.js';

const migrations = [
  {
    id: '001-init',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        identity_key BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        device_name VARCHAR(255),
        fingerprint VARCHAR(64) UNIQUE,
        public_key BYTEA NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        last_activity TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, fingerprint)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id),
        recipient_id UUID REFERENCES users(id),
        ciphertext BYTEA NOT NULL,
        sender_key BYTEA NOT NULL,
        nonce BYTEA NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days'
      );

      CREATE TABLE IF NOT EXISTS prekeys (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        device_id UUID REFERENCES devices(id),
        public_key BYTEA NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        device_id UUID REFERENCES devices(id),
        action VARCHAR(255) NOT NULL,
        details JSONB,
        ip_address INET,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
      CREATE INDEX idx_messages_expires ON messages(expires_at);
      CREATE INDEX idx_prekeys_unused ON prekeys(user_id, is_used);
      CREATE INDEX idx_devices_user ON devices(user_id);
      CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
    `,
  },
];

export const migrate = async () => {
  logger.info('Running database migrations...');

  for (const migration of migrations) {
    try {
      await query(migration.sql);
      logger.info(`✓ Migration ${migration.id} completed`);
    } catch (error) {
      logger.error(`✗ Migration ${migration.id} failed:`, error);
      throw error;
    }
  }

  logger.info('All migrations completed successfully');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(console.error);
}
