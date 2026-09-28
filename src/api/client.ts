import axios, { AxiosInstance } from 'axios';
import type { User, Device, Message } from '../types';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Authentication endpoints
  async register(
    username: string,
    identityKey: Uint8Array
  ): Promise<{ token: string; user: User }> {
    const { data } = await this.client.post('/auth/register', {
      username,
      identityKey: Array.from(identityKey),
    });
    return data;
  }

  async login(username: string, password: string): Promise<{ token: string }> {
    const { data } = await this.client.post('/auth/login', {
      username,
      password,
    });
    return data;
  }

  async verifyDevice(verificationCode: string): Promise<{ token: string }> {
    const { data } = await this.client.post('/auth/verify-device', {
      verificationCode,
    });
    return data;
  }

  async getDevices(): Promise<Device[]> {
    const { data } = await this.client.get('/auth/devices');
    return data;
  }

  async revokeDevice(deviceId: string): Promise<void> {
    await this.client.delete(`/auth/devices/${deviceId}`);
  }

  // Message endpoints
  async sendMessage(
    to: string,
    ciphertext: Uint8Array,
    senderKey: Uint8Array,
    nonce: Uint8Array
  ): Promise<Message> {
    const { data } = await this.client.post('/messages', {
      to,
      ciphertext: Array.from(ciphertext),
      senderKey: Array.from(senderKey),
      nonce: Array.from(nonce),
    });
    return data;
  }

  async getMessages(): Promise<Message[]> {
    const { data } = await this.client.get('/messages');
    return data;
  }

  async markMessageRead(messageId: string): Promise<void> {
    await this.client.patch(`/messages/${messageId}`, { isRead: true });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.client.delete(`/messages/${messageId}`);
  }

  // Key endpoints
  async uploadIdentityKey(publicKey: Uint8Array): Promise<void> {
    await this.client.post('/keys/identity', {
      publicKey: Array.from(publicKey),
    });
  }

  async getPreKeys(userId: string, count: number = 10): Promise<any[]> {
    const { data } = await this.client.get(
      `/keys/prekeys?user=${userId}&count=${count}`
    );
    return data;
  }

  async uploadPreKeys(
    preKeys: Array<{ id: number; publicKey: Uint8Array }>
  ): Promise<void> {
    await this.client.post('/keys/prekeys', {
      preKeys: preKeys.map((pk) => ({
        id: pk.id,
        publicKey: Array.from(pk.publicKey),
      })),
    });
  }

  async verifyDeviceKey(
    deviceId: string,
    fingerprint: string
  ): Promise<{ verified: boolean }> {
    const { data } = await this.client.post('/keys/verify', {
      deviceId,
      fingerprint,
    });
    return data;
  }

  // User endpoints
  async getUser(userId: string): Promise<User> {
    const { data } = await this.client.get(`/users/${userId}`);
    return data;
  }

  async getUsers(): Promise<User[]> {
    const { data } = await this.client.get('/users');
    return data;
  }
}

export default new ApiClient();
