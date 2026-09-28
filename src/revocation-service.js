import crypto from 'crypto';

/**
 * Device revocation service
 */
export class RevocationService {
  constructor(database) {
    this.db = database;
    this.revocationCache = new Map();
  }

  /**
   * Revoke a device
   */
  async revokeDevice(userId, deviceId) {
    try {
      // Mark device as revoked
      await this.db.query(
        `UPDATE devices SET is_revoked = true, revoked_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [deviceId, userId]
      );

      // Invalidate all sessions for this device
      await this.db.query(
        `UPDATE device_sessions SET is_valid = false
         WHERE device_id = $1`,
        [deviceId]
      );

      // Clear cache
      this.revocationCache.delete(deviceId);

      return { status: 'revoked' };
    } catch (error) {
      throw new Error(`Failed to revoke device: ${error.message}`);
    }
  }

  /**
   * Check if device is revoked
   */
  async isDeviceRevoked(deviceId) {
    // Check cache first
    if (this.revocationCache.has(deviceId)) {
      return this.revocationCache.get(deviceId);
    }

    try {
      const result = await this.db.query(
        'SELECT is_revoked FROM devices WHERE id = $1',
        [deviceId]
      );

      const isRevoked = result.rows.length > 0 && result.rows[0].is_revoked;
      this.revocationCache.set(deviceId, isRevoked);
      return isRevoked;
    } catch (error) {
      throw new Error(`Failed to check device revocation: ${error.message}`);
    }
  }

  /**
   * Revoke all devices except specified one
   */
  async revokeAllExcept(userId, keepDeviceId) {
    try {
      const result = await this.db.query(
        `UPDATE devices SET is_revoked = true, revoked_at = NOW()
         WHERE user_id = $1 AND id != $2
         RETURNING id`,
        [userId, keepDeviceId]
      );

      // Clear cache for all revoked devices
      result.rows.forEach((row) => {
        this.revocationCache.delete(row.id);
      });

      return { revokedCount: result.rows.length };
    } catch (error) {
      throw new Error(`Failed to revoke devices: ${error.message}`);
    }
  }

  /**
   * Create revocation certificate
   */
  createRevocationCert(deviceId, privateKey) {
    const timestamp = Date.now();
    const message = `${deviceId}:${timestamp}`;

    const signer = crypto.createSign('sha256');
    signer.update(message);
    const signature = signer.sign(privateKey, 'hex');

    return {
      deviceId,
      timestamp,
      signature,
    };
  }

  /**
   * Verify revocation certificate
   */
  verifyRevocationCert(cert, publicKey) {
    const message = `${cert.deviceId}:${cert.timestamp}`;
    const verifier = crypto.createVerify('sha256');
    verifier.update(message);

    return verifier.verify(publicKey, cert.signature, 'hex');
  }
}

export default RevocationService;
