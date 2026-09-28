import crypto from 'crypto';

/**
 * Device verification service
 */
export class VerificationService {
  constructor(database) {
    this.db = database;
  }

  /**
   * Start device verification
   */
  async startVerification(userId, deviceId, challenge) {
    try {
      const result = await this.db.query(
        `INSERT INTO device_verifications (device_id, challenge, status, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, challenge`,
        [deviceId, challenge, 'pending']
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to start verification: ${error.message}`);
    }
  }

  /**
   * Verify device with signature
   */
  async verifyDevice(userId, deviceId, signature, existingDeviceId) {
    try {
      // Get challenge
      const challengeResult = await this.db.query(
        `SELECT challenge FROM device_verifications
         WHERE device_id = $1 AND status = $2`,
        [deviceId, 'pending']
      );

      if (challengeResult.rows.length === 0) {
        throw new Error('No pending verification');
      }

      const challenge = challengeResult.rows[0].challenge;

      // Get existing device's public key
      const keyResult = await this.db.query(
        'SELECT public_key FROM devices WHERE id = $1',
        [existingDeviceId]
      );

      if (keyResult.rows.length === 0) {
        throw new Error('Device not found');
      }

      const publicKeyPEM = keyResult.rows[0].public_key;

      // Verify signature
      const isValid = this.verifySignature(challenge, signature, publicKeyPEM);

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      // Mark device as verified
      await this.db.query(
        `UPDATE devices SET is_verified = true, verified_at = NOW()
         WHERE id = $1`,
        [deviceId]
      );

      // Mark verification as complete
      await this.db.query(
        `UPDATE device_verifications SET status = $1, verified_at = NOW()
         WHERE device_id = $2`,
        ['complete', deviceId]
      );

      return { verified: true };
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Verify signature
   */
  verifySignature(challenge, signature, publicKeyPEM) {
    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(challenge);
      return verifier.verify(publicKeyPEM, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(deviceId) {
    try {
      const result = await this.db.query(
        `SELECT status, created_at, verified_at FROM device_verifications
         WHERE device_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [deviceId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to get verification status: ${error.message}`);
    }
  }
}

export default VerificationService;
