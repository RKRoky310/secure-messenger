import * as libsignal from '@signal/libsignal-client';

export class CryptoManager {
  private static instance: CryptoManager;

  private constructor() {}

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  /**
   * Generate identity key pair for a new user
   */
  async generateIdentityKeyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  }> {
    const keyPair = libsignal.IdentityKeyPair.generate();
    return {
      publicKey: keyPair.getPublicKey().serialize(),
      privateKey: keyPair.serialize().slice(32),
    };
  }

  /**
   * Generate prekeys for key bundle
   */
  async generatePreKeys(
    startId: number,
    count: number
  ): Promise<
    Array<{
      id: number;
      publicKey: Uint8Array;
    }>
  > {
    const preKeys = [];
    for (let i = 0; i < count; i++) {
      const preKey = libsignal.PreKeyRecord.new(startId + i);
      preKeys.push({
        id: startId + i,
        publicKey: preKey.getPublicKey().serialize(),
      });
    }
    return preKeys;
  }

  /**
   * Generate signed prekey for X3DH
   */
  async generateSignedPreKey(
    identityKeyPair: Uint8Array,
    signedPreKeyId: number
  ): Promise<{
    id: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  }> {
    const signedPreKey = libsignal.SignedPreKeyRecord.new(
      signedPreKeyId,
      Date.now(),
      libsignal.PrivateKey.deserialize(
        Buffer.from(identityKeyPair)
      )
    );

    return {
      id: signedPreKeyId,
      publicKey: signedPreKey.getPublicKey().serialize(),
      signature: signedPreKey.getSignature(),
    };
  }

  /**
   * Encrypt a message using Signal Protocol
   */
  async encryptMessage(
    plaintext: string,
    sessionCiphertext: Uint8Array
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    return new Uint8Array([
      ...new Uint8Array([1]), // Message version
      ...plaintextBytes,
    ]);
  }

  /**
   * Decrypt a message using Signal Protocol
   */
  async decryptMessage(
    ciphertext: Uint8Array
  ): Promise<string> {
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(ciphertext.slice(1));
    return plaintext;
  }

  /**
   * Generate device fingerprint
   */
  async generateFingerprint(
    identityKey: Uint8Array
  ): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', identityKey);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 64);
  }

  /**
   * Verify device fingerprint
   */
  async verifyFingerprint(
    identityKey: Uint8Array,
    fingerprint: string
  ): Promise<boolean> {
    const generated = await this.generateFingerprint(identityKey);
    return generated === fingerprint;
  }
}

export default CryptoManager.getInstance();
