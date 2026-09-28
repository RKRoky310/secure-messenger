import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Cryptographic - Signatures', () => {
  let privateKey;
  let publicKey;

  beforeEach(() => {
    const { privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync(
      'rsa',
      { modulusLength: 2048 }
    );
    privateKey = priv;
    publicKey = pub;
  });

  it('should sign and verify data', () => {
    const message = 'Test message';
    const signer = crypto.createSign('sha256');
    signer.update(message);
    const signature = signer.sign(privateKey, 'hex');

    const verifier = crypto.createVerify('sha256');
    verifier.update(message);
    const isValid = verifier.verify(publicKey, signature, 'hex');

    expect(isValid).toBe(true);
  });

  it('should reject tampered message', () => {
    const message = 'Test message';
    const signer = crypto.createSign('sha256');
    signer.update(message);
    const signature = signer.sign(privateKey, 'hex');

    const tamperedMessage = 'Tampered message';
    const verifier = crypto.createVerify('sha256');
    verifier.update(tamperedMessage);
    const isValid = verifier.verify(publicKey, signature, 'hex');

    expect(isValid).toBe(false);
  });

  it('should reject invalid signature', () => {
    const message = 'Test message';
    const signer = crypto.createSign('sha256');
    signer.update(message);
    signer.sign(privateKey, 'hex');

    const invalidSignature = crypto.randomBytes(256).toString('hex');
    const verifier = crypto.createVerify('sha256');
    verifier.update(message);
    const isValid = verifier.verify(publicKey, invalidSignature, 'hex');

    expect(isValid).toBe(false);
  });
});
