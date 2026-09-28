import crypto from 'crypto';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

/**
 * Device management service
 */
export class DeviceManager {
  /**
   * Generate unique device fingerprint
   */
  static generateFingerprint(publicKey) {
    const hash = crypto.createHash('sha256');
    hash.update(publicKey);
    return hash.digest('hex');
  }

  /**
   * Generate device challenge for verification
   */
  static generateChallenge() {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate QR code for device verification
   */
  static async generateQRCode(challenge, deviceId) {
    const data = JSON.stringify({
      challenge,
      deviceId,
      timestamp: Date.now(),
    });

    return QRCode.toDataURL(data);
  }

  /**
   * Generate recovery codes
   */
  static generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
      codes.push(formatted);
    }
    return codes;
  }

  /**
   * Hash recovery code for storage
   */
  static hashRecoveryCode(code) {
    const hash = crypto.createHash('sha256');
    hash.update(code);
    return hash.digest('hex');
  }

  /**
   * Verify recovery code
   */
  static verifyRecoveryCode(code, storedHash) {
    const testHash = this.hashRecoveryCode(code);
    return crypto.timingSafeEqual(
      Buffer.from(testHash),
      Buffer.from(storedHash)
    );
  }

  /**
   * Create device session
   */
  static createSession(deviceId) {
    return {
      id: uuidv4(),
      deviceId,
      sessionKey: randomBytes(32),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  /**
   * Verify device signature
   */
  static verifySignature(challenge, signature, publicKeyPEM) {
    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(challenge);
      return verifier.verify(publicKeyPEM, signature, 'hex');
    } catch (error) {
      return false;
    }
  }
}

export default DeviceManager;
