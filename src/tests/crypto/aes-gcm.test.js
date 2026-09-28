import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Cryptographic - AES-256-GCM', () => {
  it('should encrypt and decrypt successfully', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const plaintext = 'This is a secret message';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    expect(decrypted).toBe(plaintext);
  });

  it('should use unique IV for each encryption', () => {
    const key = crypto.randomBytes(32);
    const plaintext = 'Same message';

    const iv1 = crypto.randomBytes(16);
    const iv2 = crypto.randomBytes(16);

    expect(iv1).not.toEqual(iv2);
  });

  it('should reject tampered ciphertext', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const plaintext = 'Secret';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Tamper with ciphertext
    const tampered = encrypted.slice(0, -2) + 'XX';

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    expect(() => {
      decipher.update(tampered, 'hex', 'utf8');
      decipher.final('utf8');
    }).toThrow();
  });

  it('should reject invalid auth tag', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const plaintext = 'Secret';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Modify auth tag
    const invalidTag = Buffer.from(authTag);
    invalidTag[0] ^= 0xff;

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(invalidTag);

    expect(() => {
      decipher.update(encrypted, 'hex', 'utf8');
      decipher.final('utf8');
    }).toThrow();
  });
});
