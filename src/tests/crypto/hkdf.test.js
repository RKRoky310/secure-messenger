import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Cryptographic - HKDF', () => {
  it('should derive key from shared secret', () => {
    const salt = Buffer.from('salt');
    const ikm = Buffer.from('input-key-material');
    const info = Buffer.from('info');

    const hkdf = crypto.hkdfSync('sha256', ikm, salt, info, 32);

    expect(hkdf).toHaveLength(32);
    expect(hkdf).toBeInstanceOf(Buffer);
  });

  it('should produce consistent output for same input', () => {
    const salt = Buffer.from('salt');
    const ikm = Buffer.from('input-key-material');
    const info = Buffer.from('info');

    const key1 = crypto.hkdfSync('sha256', ikm, salt, info, 32);
    const key2 = crypto.hkdfSync('sha256', ikm, salt, info, 32);

    expect(key1).toEqual(key2);
  });

  it('should produce different output for different salt', () => {
    const ikm = Buffer.from('input-key-material');
    const info = Buffer.from('info');

    const key1 = crypto.hkdfSync('sha256', ikm, Buffer.from('salt1'), info, 32);
    const key2 = crypto.hkdfSync('sha256', ikm, Buffer.from('salt2'), info, 32);

    expect(key1).not.toEqual(key2);
  });

  it('should produce different output for different info', () => {
    const salt = Buffer.from('salt');
    const ikm = Buffer.from('input-key-material');

    const key1 = crypto.hkdfSync('sha256', ikm, salt, Buffer.from('info1'), 32);
    const key2 = crypto.hkdfSync('sha256', ikm, salt, Buffer.from('info2'), 32);

    expect(key1).not.toEqual(key2);
  });
});
