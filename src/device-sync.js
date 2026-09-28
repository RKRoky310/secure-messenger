import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * Device sync service for cross-device message synchronization
 */
export class DeviceSyncService extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;
  }

  /**
   * Sync messages to newly verified device
   */
  async syncMessagesToDevice(userId, deviceId, deviceKey) {
    try {
      // Fetch pending messages
      const messages = await this.db.query(
        `SELECT * FROM messages
         WHERE recipient_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC`,
        [userId]
      );

      // Encrypt for device
      const encryptedMessages = messages.map((msg) =>
        this.encryptForDevice(msg, deviceKey)
      );

      // Store sync record
      await this.db.query(
        `INSERT INTO device_syncs (device_id, message_count, created_at)
         VALUES ($1, $2, NOW())`,
        [deviceId, encryptedMessages.length]
      );

      return encryptedMessages;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Sync contact list to device
   */
  async syncContactsToDevice(userId, deviceId, deviceKey) {
    try {
      // Fetch contacts
      const contacts = await this.db.query(
        `SELECT DISTINCT recipient_id FROM messages
         WHERE sender_id = $1 OR recipient_id = $1
         ORDER BY MAX(created_at) DESC`,
        [userId]
      );

      // Fetch user details for each contact
      const contactDetails = await Promise.all(
        contacts.map((c) =>
          this.db.query('SELECT id, username FROM users WHERE id = $1', [
            c.recipient_id,
          ])
        )
      );

      // Encrypt for device
      const encryptedContacts = contactDetails
        .map((r) => r.rows[0])
        .filter(Boolean)
        .map((contact) => this.encryptForDevice(contact, deviceKey));

      return encryptedContacts;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Sync other devices to new device
   */
  async syncDevicesToDevice(userId, deviceId, deviceKey) {
    try {
      const devices = await this.db.query(
        `SELECT id, device_name, device_type, fingerprint, is_verified, last_activity
         FROM devices
         WHERE user_id = $1 AND id != $2`,
        [userId, deviceId]
      );

      return devices.rows.map((device) =>
        this.encryptForDevice(device, deviceKey)
      );
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Encrypt data for device
   */
  encryptForDevice(data, deviceKey) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', deviceKey, iv);

    const plaintext = JSON.stringify(data);
    const encrypted = cipher.update(plaintext, 'utf8', 'hex');
    cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Perform full device sync
   */
  async fullSync(userId, deviceId, deviceKey) {
    try {
      const [messages, contacts, devices] = await Promise.all([
        this.syncMessagesToDevice(userId, deviceId, deviceKey),
        this.syncContactsToDevice(userId, deviceId, deviceKey),
        this.syncDevicesToDevice(userId, deviceId, deviceKey),
      ]);

      return {
        messages,
        contacts,
        devices,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

export default DeviceSyncService;
