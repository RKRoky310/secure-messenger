# Secure Messenger

This repository contains a secure communications starter app that demonstrates:

- end-to-end encryption using NaCl / X25519-style cryptography
- a zero-knowledge server model where the backend stores only ciphertext
- realtime messaging via Socket.IO
- simple device-local key management with browser `localStorage`

Important: this is a security-focused starter, not a production-ready system. A production app should include:

- strong user authentication
- auditing from security experts
- hardware-backed key storage on mobile devices
- device verification and revocation
- secure backup and recovery flows
- server hardening and vulnerability scanning
- abuse detection and rate limiting

## Threat model

This demo is designed to protect messages from passive network observers and a server that only sees ciphertext, assuming the user's device is not already compromised. If an attacker gains full control of the phone, it's still possible to read decrypted data in memory or steal local app secrets.

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## How to use

1. Register a username.
2. Open the app in a second browser tab or another browser profile using a different username.
3. Exchange public keys automatically when both users are present.
4. Send encrypted messages.
5. Messages are encrypted locally before they are sent to the backend.

## Security notes

- Private keys are stored in the browser local storage of the current device.
- The backend stores public keys and ciphertext only.
- The encryption uses a shared secret derived from X25519 and NaCl secretbox.
- This is a clean starting point, not a full production cryptographic implementation.

## Default user flow

- `POST /api/register` registers a username and public key
- `GET /api/users` lists registered users
- `POST /api/messages` stores encrypted messages for delivery
- `GET /api/messages?user=<username>` fetches decrypted-but-client-side messages or ciphertext for client-side decryption
- realtime socket events update recipients immediately

## Start with secure architecture in mind

A real app should eventually move to:

- Signal Protocol / Double Ratchet
- hardware-backed keys on mobile platforms
- secure key rotation
- per-device verification and revocation
- open-source protocol review
- formal security audit

## License

MIT
