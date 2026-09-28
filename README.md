# Secure Messenger - Backend Server

Production-grade backend for end-to-end encrypted messaging with zero-knowledge architecture.

## Features

- **Zero-Knowledge Design** - Server never sees plaintext messages
- **PostgreSQL** - Persistent encrypted message storage
- **Redis** - Real-time presence, delivery notifications, rate limiting
- **JWT Authentication** - Stateless device authentication
- **WebSocket** - Real-time message delivery via Socket.IO
- **Rate Limiting** - DDoS and abuse protection
- **Message Queue** - Delayed delivery for offline users
- **Audit Logging** - Security events and access logs
- **TLS 1.3** - Secure transport with certificate pinning
- **CORS Protection** - Strict origin validation

## Architecture

### Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT (RS256)
- **Real-time**: Socket.IO 4+
- **Security**: helmet, express-rate-limit, bcryptjs

### Data Flow

```
Client                  Backend                    Database
  |
  |-- Encrypted msg --->
  |                       |-- Store ciphertext --->
  |                       |   (can't decrypt)
  |                       |<-- Confirm stored ----
  |<-- ACK ---------------|
  |                       |
  |                       |-- Notify recipient -->
  |<-- WebSocket notify --|
  |
  |-- Fetch messages --->
  |                       |-- Query DB ---|
  |                       |<-- Return ---|
  |                       |   ciphertext only
  |<-- Ciphertext msg ---|
  |-- Decrypt locally ---|
```

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for containerization)

### Setup

```bash
npm install

# Create .env
cp .env.example .env

# Update .env with your configuration

# Run migrations
npm run migrate

# Start development
npm run dev
```

## Configuration

Create `.env`:

```env
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/secure_messenger
DB_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_CLUSTER=false

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRY=7d
JWT_ALGORITHM=RS256

# CORS
ALLOWED_ORIGINS=https://app.securemessenger.app,https://web.securemessenger.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
SESSION_TIMEOUT=3600000
MESSAGE_RETENTION_DAYS=90
MAX_DEVICES_PER_USER=5

# Monitoring
SENTRY_DSN=
PROMETHEUS_PORT=9090
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Authenticate device
- `POST /api/v1/auth/verify` - Verify device registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout device

### Keys
- `POST /api/v1/keys/identity` - Upload identity key
- `GET /api/v1/keys/identity/:userId` - Fetch identity key
- `POST /api/v1/keys/prekeys` - Upload prekeys
- `GET /api/v1/keys/prekeys/:userId` - Fetch prekeys
- `DELETE /api/v1/keys/prekeys/:preKeyId` - Mark prekey as used

### Messages
- `POST /api/v1/messages` - Send encrypted message
- `GET /api/v1/messages` - Fetch user messages
- `PATCH /api/v1/messages/:id` - Mark as read
- `DELETE /api/v1/messages/:id` - Delete message
- `GET /api/v1/messages/:id/status` - Get delivery status

### Devices
- `GET /api/v1/devices` - List user devices
- `POST /api/v1/devices/:id/verify` - Verify device
- `DELETE /api/v1/devices/:id` - Revoke device
- `PATCH /api/v1/devices/:id/activity` - Update last activity

### Users
- `GET /api/v1/users/search` - Search users by username
- `GET /api/v1/users/:id` - Get user profile
- `PATCH /api/v1/users/:id` - Update profile
- `DELETE /api/v1/users/:id` - Delete account

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  identity_key BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_name VARCHAR(255),
  fingerprint VARCHAR(64) UNIQUE,
  public_key BYTEA NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, fingerprint)
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
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

CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_expires ON messages(expires_at);
```

### PreKeys Table
```sql
CREATE TABLE prekeys (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_id UUID REFERENCES devices(id),
  public_key BYTEA NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prekeys_unused ON prekeys(user_id, is_used);
```

## Security Measures

### Transport Security
- TLS 1.3 only
- Certificate pinning
- HSTS headers
- Strict-Transport-Security

### Authentication
- JWT RS256 (asymmetric)
- Device fingerprinting
- Per-device tokens
- Automatic token rotation

### Data Protection
- Database encryption at rest
- Field-level encryption for sensitive data
- Automatic message deletion after 90 days
- Secure password hashing (bcrypt)

### Rate Limiting
- 1000 requests per 15 minutes (default)
- Per-IP limiting
- Per-user limiting
- Dynamic rate adjustment

### Logging & Monitoring
- Audit trail for all sensitive operations
- Failed authentication logging
- Rate limit violation logging
- No plaintext message logging

## Running Locally

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
npm run test:integration
npm run test:security
```

### Production
```bash
npm run build
npm start
```

## Docker Deployment

```bash
docker-compose up -d
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Metrics (Prometheus)
```bash
curl http://localhost:9090/metrics
```

## Security Audit Checklist

- [ ] All endpoints require authentication
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database encrypted
- [ ] TLS 1.3 enforced
- [ ] No plaintext logging
- [ ] Audit trail complete
- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF tokens for state-changing operations
- [ ] Security headers set
- [ ] Password hashing secure
- [ ] JWT validation strict
- [ ] Device verification required

## Performance Optimization

- Connection pooling (20 connections)
- Redis caching for hot data
- Message pagination (50 per page)
- Indexed database queries
- Gzip compression enabled
- HTTP/2 support

## License

MIT
