# Secure Messenger - Device Management

Multi-device support with per-device cryptographic binding, verification, and revocation.

## Features

- **Multi-Device Support** - Up to 5 devices per user
- **Device Fingerprinting** - Unique cryptographic identity per device
- **Device Verification** - QR code or manual verification
- **Device Revocation** - Remote device logout and key deletion
- **Cross-Device Sync** - Automatic message sync across devices
- **Device-Bound Keys** - Each device has its own encryption key
- **Activity Tracking** - Last activity timestamp per device
- **Lost Device Protection** - Immediate device revocation
- **Recovery Codes** - One-time backup codes for account recovery

## Architecture

### Device Registration Flow

```
New Device                 Backend                  Existing Device
    |
    |-- Generate keys --->
    |                       |-- Create device record
    |                       |-- Generate challenge
    |                       |<-- Send challenge
    |<-- Challenge --------|
    |                       |
    |-- QR Code Display ---|
    |                       |
    |<-- Scan with existing|
    |                       |-- Verify signature
    |                       |-- Create session
    |                       |-- Auto-sync messages
    |<-- Verified ---------|
```

### Device Verification Methods

1. **QR Code Verification** (Recommended)
   - Scan QR code from new device
   - Sign with existing device key
   - Instant verification

2. **Manual Verification**
   - Compare fingerprints manually
   - Confirm on existing device
   - Approve new device

3. **Recovery Code**
   - Use one-time recovery code
   - Limited use (1-3 times)
   - For device recovery scenarios

## Device Binding

Each device is bound to the user account via:

1. **Identity Key** - User-level, long-term key
2. **Device Key** - Per-device, ephemeral key
3. **Session Key** - Per-session, temporary key
4. **Fingerprint** - SHA256(device_key), human-readable

### Key Hierarchy

```
Identity Key (User-Level)
    |
    +-- Device 1 Key
    |   |
    |   +-- Session 1 Key
    |   +-- Session 2 Key
    |
    +-- Device 2 Key
    |   |
    |   +-- Session 1 Key
    |   +-- Session 2 Key
```

## Installation

```bash
git clone <repo>
git checkout device-management
npm install
```

## API Endpoints

### Device Registration

**POST** `/api/v1/devices/register`
```json
{
  "deviceName": "iPhone 15",
  "deviceType": "ios",
  "publicKey": "<base64-encoded-key>"
}
```

Response:
```json
{
  "deviceId": "<uuid>",
  "challenge": "<challenge-string>",
  "qrCode": "<qr-data-url>",
  "verificationCode": "<6-digit-code>"
}
```

### Device Verification

**POST** `/api/v1/devices/:deviceId/verify`
```json
{
  "verificationMethod": "qr_code",
  "signature": "<signature-from-existing-device>",
  "timestamp": 1234567890
}
```

### List Devices

**GET** `/api/v1/devices`

Response:
```json
{
  "devices": [
    {
      "id": "<uuid>",
      "name": "iPhone 15",
      "type": "ios",
      "fingerprint": "<sha256>",
      "isVerified": true,
      "isPrimary": true,
      "lastActivity": "2024-09-28T18:00:00Z",
      "createdAt": "2024-09-20T10:00:00Z"
    }
  ]
}
```

### Revoke Device

**DELETE** `/api/v1/devices/:deviceId`

### Update Device Activity

**PATCH** `/api/v1/devices/:deviceId/activity`

## Device Sync

When a device is verified, it automatically receives:

1. **Pending Messages** - All unread messages from the period offline
2. **Contact List** - List of verified contacts
3. **Device List** - Other verified devices
4. **Settings** - User preferences and configuration

### Message Sync Protocol

```
New Device                 Backend
    |
    |-- Request sync --->
    |                    |-- Query pending messages
    |                    |-- Fetch contact list
    |                    |-- Fetch device list
    |                    |-- Encrypt for device key
    |<-- Sync data ------|
    |
    |-- Decrypt locally --
    |-- Save to DB
    |-- Notify UI
```

## Security Considerations

### Device Compromise

If a device is compromised:

1. User revokes device immediately
2. Backend invalidates all device sessions
3. Device loses access to messages
4. Historical messages remain protected (forward secrecy)

### Lost Device Recovery

1. User marks device as lost in settings
2. Device is immediately revoked
3. Recovery codes can be used to register new device
4. No manual verification needed for recovery

### Device Lockout

If user is locked out:

1. Use recovery code
2. Email verification link
3. Support team verification

## Implementation Guide

### Backend Setup

1. Create device registration endpoint
2. Generate QR code with challenge
3. Verify signature from existing device
4. Create device record and sessions
5. Sync historical messages

### Frontend Implementation

**Register New Device**
```typescript
const registerDevice = async (deviceName: string) => {
  const keyPair = generateKeyPair();
  const response = await api.post('/devices/register', {
    deviceName,
    publicKey: keyPair.publicKey,
  });
  
  return {
    deviceId: response.deviceId,
    qrCode: response.qrCode,
    challenge: response.challenge,
  };
};
```

**Verify with Existing Device**
```typescript
const verifyDevice = async (deviceId: string, challenge: string) => {
  const signature = signWithPrivateKey(challenge, privateKey);
  
  const response = await api.post(`/devices/${deviceId}/verify`, {
    signature,
    timestamp: Date.now(),
  });
  
  return response.verified;
};
```

## Recovery Codes

Generate 10 recovery codes:

```
3K9M-2L5X
7Q2N-8R9D
4P1V-6S8H
2B7W-5F3G
9C4K-1J6T
...
```

Each code is:
- 8 characters + 1 dash
- One-time use (can be regenerated)
- Hashed in database
- Displayed once during setup

## Database Schema

### Devices Table
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- ios, android, web
  public_key BYTEA NOT NULL,
  fingerprint VARCHAR(64) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, fingerprint)
);
```

### Recovery Codes Table
```sql
CREATE TABLE recovery_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  code_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Device Sessions Table
```sql
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id),
  session_key BYTEA NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

## Testing

```bash
# Run device management tests
npm run test:devices

# Test device verification
npm run test:verification

# Test device revocation
npm run test:revocation
```

## Deployment Checklist

- [ ] Device table created
- [ ] Recovery codes table created
- [ ] Sessions table created
- [ ] Fingerprint generation implemented
- [ ] QR code generation implemented
- [ ] Device verification logic implemented
- [ ] Message sync implemented
- [ ] Device revocation implemented
- [ ] Recovery flow tested
- [ ] Rate limiting on device registration
- [ ] Audit logging for device changes

## License

MIT
