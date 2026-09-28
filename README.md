# Secure Messenger - Android

Production-grade encrypted messaging app for Android with Signal Protocol, hardware-backed keys, and device verification.

## Features

- **Signal Protocol** - Double Ratchet with forward secrecy
- **Hardware-Backed Keys** - Android Keystore for private key storage
- **Biometric Authentication** - Face/fingerprint unlock
- **End-to-End Encryption** - All messages encrypted client-side
- **Device Verification** - QR code scanning for peer verification
- **Secure Backup** - User-controlled encrypted backups
- **Real-time Messaging** - WebSocket for instant delivery
- **Offline Support** - Local SQLite database with automatic sync
- **Screen Security** - Prevent screenshots and screen recording

## Architecture

### Tech Stack
- Kotlin (100% Kotlin codebase)
- Jetpack Compose for UI
- Room Database with encryption (SQLCipher)
- Tink for cryptographic operations
- libsignal (Signal Protocol library)
- Coroutines for async operations
- MVVM + Repository pattern

### Security Stack
- Android Keystore System (hardware-backed when available)
- Biometric API for authentication
- TLS 1.3 for network communication
- SQLCipher for database encryption
- EncryptedSharedPreferences for app settings

## Project Structure

```
app/src/main/kotlin/com/securemessenger/
├── ui/                    # Jetpack Compose UI
│   ├── auth/             # Authentication screens
│   ├── chat/             # Chat screens
│   ├── contacts/         # Contacts list
│   └── settings/         # Settings
├── data/
│   ├── local/            # Room database
│   ├── remote/           # API client
│   └── repository/       # Repository pattern
├── domain/
│   ├── model/            # Data classes
│   ├── usecase/          # Business logic
│   └── repository/       # Repository interfaces
├── crypto/               # Cryptographic operations
├── security/             # Security utilities
└── MainActivity.kt
```

## Installation

### Prerequisites
- Android Studio 2023.1+
- Android SDK 31+
- Kotlin 1.9+

### Build
```bash
./gradlew build
```

### Run
```bash
./gradlew installDebug
```

## Security Model

### Threat Model

**Protected against:**
- Network eavesdropping (TLS 1.3)
- Server compromise (E2EE)
- Passive traffic analysis
- Unauthorized app access (biometric + device lock)
- Database theft (encrypted with device key)

**Not protected against:**
- Compromised device OS (rooted/jailbroken)
- Physical theft (if device is unlocked)
- Malware with system privileges

### Key Storage

1. **Identity Keys** - Stored in Android Keystore
   - Hardware-backed when possible
   - Requires biometric/device authentication

2. **Message Keys** - Derived on-the-fly
   - Never stored in plaintext
   - Protected by Signal Protocol ratchet

3. **Backup Keys** - User-controlled passphrase
   - Encrypted with PBKDF2
   - Zero-knowledge backup system

### Encryption Flow

```
┌─────────────────────────────────────┐
│ User Types Message                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Signal Protocol Ratchet             │
│ (Derives ephemeral message key)     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Tink AES-256-GCM Encryption         │
│ (Authenticated encryption)          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ TLS 1.3 Transport                   │
│ (Network encryption)                │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Server (sees only ciphertext)       │
└─────────────────────────────────────┘
```

## Configuration

Create `local.properties`:
```properties
sdk.dir=/path/to/android/sdk
API_BASE_URL=https://api.securemessenger.app
API_TIMEOUT=30
```

## Development

### Running Tests
```bash
# Unit tests
./gradlew test

# Android tests
./gradlew connectedAndroidTest

# Security tests
./gradlew test -k CryptoTest
```

### Code Quality
```bash
# Lint
./gradlew lint

# Format
./gradlew ktlintFormat
```

## API Integration

The app communicates with the backend via REST API with WebSocket upgrade:

- `POST /auth/register` - Register device
- `POST /auth/login` - Device authentication
- `GET /messages` - Fetch encrypted messages
- `POST /messages` - Send encrypted message
- `WS /ws` - Real-time message delivery

## Security Checklist

- [ ] Compile with minify enabled
- [ ] Sign release APK with production key
- [ ] Enable ProGuard/R8 rules for crypto libs
- [ ] Test on real device with security patches
- [ ] Verify hardware keystore usage (logcat check)
- [ ] Test backup/restore flow
- [ ] Verify biometric fallback
- [ ] Check for hardcoded secrets
- [ ] Run security scanner (MobSF)
- [ ] Verify TLS certificate pinning

## Release Build

```bash
./gradlew bundleRelease
```

This generates `app/build/outputs/bundle/release/app-release.aab`

## License

MIT
