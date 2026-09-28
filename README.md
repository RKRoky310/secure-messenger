# Secure Messenger - iOS

Production-grade encrypted messaging app for iOS with Signal Protocol, Secure Enclave, and biometric authentication.

## Features

- **Signal Protocol** - Double Ratchet with forward secrecy
- **Secure Enclave** - Hardware-backed key storage
- **Face ID / Touch ID** - Biometric authentication
- **End-to-End Encryption** - All messages encrypted client-side
- **Device Verification** - QR code scanning
- **Secure Backup** - iCloud Keychain integration
- **Real-time Messaging** - WebSocket for instant delivery
- **Offline Support** - Core Data with automatic sync
- **Screen Security** - Privacy screen when backgrounded

## Architecture

### Tech Stack
- Swift 5.9+
- SwiftUI for UI
- Combine for reactive programming
- Core Data for local storage
- CryptoKit for cryptographic operations
- libsignal for Signal Protocol
- URLSession for networking

### Security Stack
- Secure Enclave for key storage
- LocalAuthentication for biometrics
- CryptoKit (Apple's cryptography framework)
- TLS 1.3 with certificate pinning
- App Transport Security (ATS) hardening

## Project Structure

```
SecureMessenger/
├── App/
│   └── SecureMessengerApp.swift
├── Features/
│   ├── Auth/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Models/
│   ├── Chat/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Models/
│   └── Settings/
│       ├── Views/
│       └── ViewModels/
├── Services/
│   ├── CryptoService.swift
│   ├── KeychainService.swift
│   ├── DatabaseService.swift
│   └── APIService.swift
├── Models/
├── Utilities/
└── Resources/
```

## Installation

### Prerequisites
- Xcode 15.0+
- iOS 15.0+
- Swift 5.9+

### Development Setup

1. Clone repository
2. Open `SecureMessenger.xcodeproj`
3. Select target and run on simulator or device

## Security Model

### Threat Model

**Protected against:**
- Network eavesdropping (TLS 1.3 + certificate pinning)
- Server compromise (E2EE)
- Passive traffic analysis
- Unauthorized app access (biometric + device passcode)
- Database theft (encrypted with device key)

**Not protected against:**
- Jailbroken device
- Physical theft (if device is unlocked)
- Malware with system privileges

### Key Storage

1. **Identity Keys** - Stored in Secure Enclave
   - Protected by device passcode
   - Requires biometric unlock
   - Never leaves the enclave

2. **Message Keys** - Derived on-the-fly
   - Never stored in plaintext
   - Protected by Signal Protocol ratchet

3. **Backup Keys** - User-controlled passphrase
   - Encrypted with PBKDF2-SHA256
   - Zero-knowledge backup

### Encryption Flow

```
┌─────────────────────────────┐
│ User Types Message           │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Signal Protocol Ratchet      │
│ (Derives ephemeral key)      │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│ CryptoKit AES-256-GCM        │
│ (Authenticated encryption)   │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│ TLS 1.3 Transport            │
│ (Network encryption)         │
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Server (sees only ciphertext)│
└─────────────────────────────┘
```

## Configuration

Create `Config.xcconfig`:
```xcconfig
API_BASE_URL = https://api.securemessenger.app
API_TIMEOUT = 30
CERTIFICATE_PINS = SHA256/abcd1234...
```

## Development

### Running Tests
```bash
# Unit tests
xcodebuild test -scheme SecureMessenger

# UI tests
xcodebuild test -scheme SecureMessenger -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Code Quality
```bash
# SwiftLint
swiftlint lint --fix

# Format
swiftformat .
```

## API Integration

The app communicates with the backend via REST API with WebSocket upgrade:

- `POST /auth/register` - Register device
- `POST /auth/login` - Device authentication
- `GET /messages` - Fetch encrypted messages
- `POST /messages` - Send encrypted message
- `WS /ws` - Real-time message delivery

## Security Checklist

- [ ] Enable Code Signing
- [ ] Set up Team ID and Bundle Identifier
- [ ] Verify Secure Enclave usage
- [ ] Enable data protection (NSFileProtectionComplete)
- [ ] Verify biometric fallback
- [ ] Test on real device
- [ ] Run Security framework audits
- [ ] Check for hardcoded secrets
- [ ] Verify TLS certificate pinning
- [ ] Test app in background
- [ ] Verify Keychain access control

## Release Build

1. Update version in `Info.plist`
2. Archive: `xcodebuild archive -scheme SecureMessenger`
3. Export and sign
4. Upload to TestFlight or App Store

## Privacy & Security

- App **never** stores plaintext messages
- **All** encryption happens on-device
- **No** location tracking
- **No** analytics of message content
- **No** third-party ad networks
- **No** background data collection

## License

MIT
