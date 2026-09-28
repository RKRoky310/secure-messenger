export interface User {
  id: string;
  username: string;
  identityKey: Uint8Array;
  createdAt: Date;
  isVerified: boolean;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  publicKey: Uint8Array;
  fingerprint: string;
  isVerified: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  ciphertext: Uint8Array;
  senderKey: Uint8Array;
  nonce: Uint8Array;
  timestamp: Date;
  isRead: boolean;
  deliveryStatus: 'pending' | 'delivered' | 'read';
}

export interface Session {
  sessionId: string;
  userId: string;
  deviceId: string;
  remoteIdentityKey: Uint8Array;
  senderChainKey: Uint8Array;
  receiverChainKey: Uint8Array;
  messageCounter: number;
  isInitialized: boolean;
  createdAt: Date;
}

export interface PreKey {
  preKeyId: number;
  publicKey: Uint8Array;
  timestamp: Date;
  isUsed: boolean;
}

export interface EncryptedMessage {
  deviceId: string;
  body: Uint8Array;
  type: number;
  counter: number;
  previousCounter: number;
}
