import Dexie, { Table } from 'dexie';
import type { User, Device, Message, Session, PreKey } from '../types';

export class SecureDatabase extends Dexie {
  users!: Table<User>;
  devices!: Table<Device>;
  messages!: Table<Message>;
  sessions!: Table<Session>;
  preKeys!: Table<PreKey>;

  constructor() {
    super('SecureMessenger');
    this.version(1).stores({
      users: '&id, username',
      devices: '&id, userId',
      messages: '&id, from, to, timestamp',
      sessions: '&sessionId, userId, deviceId',
      preKeys: '&preKeyId, userId, isUsed',
    });
  }

  /**
   * Initialize database with encryption key
   */
  async initWithEncryption(encryptionKey: Uint8Array): Promise<void> {
    // In production, use the encryption key for database encryption
    // For now, this is a placeholder for secure storage implementation
    localStorage.setItem(
      'db-encryption-key',
      Array.from(encryptionKey).join(',')
    );
  }

  /**
   * Store encrypted message
   */
  async storeMessage(message: Message): Promise<void> {
    await this.messages.add(message);
  }

  /**
   * Get messages for a conversation
   */
  async getConversation(
    userId: string,
    contactId: string
  ): Promise<Message[]> {
    return this.messages
      .where('from')
      .equals(contactId)
      .or('from')
      .equals(userId)
      .filter(
        (msg) =>
          (msg.from === contactId && msg.to === userId) ||
          (msg.from === userId && msg.to === contactId)
      )
      .reverse()
      .limit(100)
      .toArray();
  }

  /**
   * Store user device
   */
  async storeDevice(device: Device): Promise<void> {
    await this.devices.add(device);
  }

  /**
   * Get all devices for user
   */
  async getDevices(userId: string): Promise<Device[]> {
    return this.devices.where('userId').equals(userId).toArray();
  }

  /**
   * Mark device as verified
   */
  async verifyDevice(deviceId: string): Promise<void> {
    await this.devices.update(deviceId, { isVerified: true });
  }

  /**
   * Store session state
   */
  async storeSession(session: Session): Promise<void> {
    await this.sessions.put(session);
  }

  /**
   * Get session state
   */
  async getSession(
    userId: string,
    deviceId: string
  ): Promise<Session | undefined> {
    return this.sessions
      .where('userId')
      .equals(userId)
      .and((s) => s.deviceId === deviceId)
      .first();
  }

  /**
   * Store prekey
   */
  async storePreKey(preKey: PreKey): Promise<void> {
    await this.preKeys.add(preKey);
  }

  /**
   * Mark prekey as used
   */
  async markPreKeyUsed(preKeyId: number): Promise<void> {
    await this.preKeys.update(preKeyId, { isUsed: true });
  }

  /**
   * Get unused prekeys
   */
  async getUnusedPreKeys(count: number): Promise<PreKey[]> {
    return this.preKeys
      .where('isUsed')
      .equals(false)
      .limit(count)
      .toArray();
  }
}

export const db = new SecureDatabase();
export default db;
