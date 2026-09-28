# Secure Messenger - Advanced Web App

Production-grade encrypted messaging with Signal Protocol, device verification, and secure key management.

## Features

- **Signal Protocol (Double Ratchet)** - Forward secrecy and post-compromise security
- **X3DH Key Exchange** - Secure initial key agreement
- **Device Verification** - QR code and fingerprint verification
- **Secure Key Storage** - IndexedDB with encryption at rest
- **End-to-End Encryption** - All messages encrypted client-side
- **Perfect Forward Secrecy** - Compromised keys don't expose past messages
- **Zero-Knowledge Server** - Backend stores only ciphertext
- **Real-time Messaging** - Socket.IO for instant delivery
- **Offline Support** - Service Workers for offline queue and sync

## Architecture

### Frontend Stack
- React 18+
- Signal Protocol library (@signal/libsignal-client)
- IndexedDB for secure local storage
- Service Workers for offline support
- WebCrypto API for hardware-backed operations

### Backend Stack
- Node.js / Express
- PostgreSQL for encrypted message storage
- Redis for real-time presence and delivery
- JWT-based device authentication

## Installation

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Security Model

### Threat Model

**Protected against:**
- Network eavesdropping
- Server compromise (reads only ciphertext)
- Passive traffic analysis
- Past message exposure (perfect forward secrecy)

**Not protected against:**
- Compromised device OS (malware with root access)
- Physical device theft (if screen is unlocked)
- Compromised user credentials

### Key Management

1. **Identity Keys**: Long-term keys stored in secure enclave (if available)
2. **Prekeys**: Short-lived keys for initial contact
3. **Ratchet Keys**: Ephemeral keys for each message
4. **Device Keys**: Per-device cryptographic binding

### Encryption Flow

```
User A                          Server                        User B
  |
  |-- Register identity key --->
  |                              |-- Store identity key -->
  |                              |<-- Return prekeys ----
  |<-- Fetch prekeys -----------|
  |                                                          |
  |-- X3DH key agreement ---->
  |   (derives initial session key)
  |                              |-- Store encrypted message ->
  |                              |                              |
  |                              |<-- Fetch message ----------|
  |                              |    (ciphertext only)       |
  |                              |
  |-- Decrypt with ratchet ---|
  |    (server can't decrypt)
```

## Running Locally

### Development Mode
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Security Best Practices

1. **Always verify device fingerprints** before trusting a new device
2. **Back up recovery codes** to a secure location
3. **Enable screen lock** on your device
4. **Keep the app updated** for security patches
5. **Review active devices** regularly

## API Reference

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Device login
- `POST /auth/verify-device` - Verify new device
- `GET /auth/devices` - List active devices

### Messages
- `POST /messages` - Send encrypted message
- `GET /messages` - Fetch messages
- `DELETE /messages/:id` - Delete message

### Keys
- `POST /keys/identity` - Upload identity key
- `GET /keys/prekeys` - Fetch prekeys
- `POST /keys/verify` - Verify device key

## Development

### File Structure
```
src/
  components/       # React components
  crypto/          # Cryptographic operations
  db/              # IndexedDB layer
  api/             # Backend API client
  hooks/           # Custom React hooks
  pages/           # Page components
  types/           # TypeScript types
  utils/           # Utilities
```

### Adding New Features

1. Keep cryptographic operations in `src/crypto/`
2. Use `src/db/` for all storage operations
3. Add new API endpoints in `src/api/`
4. Use React hooks in `src/hooks/`

## Testing

```bash
npm run test           # Unit tests
npm run test:crypto    # Cryptography tests
npm run test:e2e       # End-to-end tests
```

## Deployment

### Security Checklist
- [ ] Enable HTTPS only
- [ ] Set CSP headers
- [ ] Enable HSTS
- [ ] Configure CORS properly
- [ ] Use secure cookies (HttpOnly, Secure, SameSite)
- [ ] Run security audit: `npm audit`
- [ ] Review dependencies for vulnerabilities
- [ ] Enable rate limiting
- [ ] Set up intrusion detection
- [ ] Configure database encryption

## License

MIT
