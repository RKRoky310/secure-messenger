import { describe, it, expect, beforeEach } from 'vitest';
import DeviceManager from '../device-manager.js';

describe('DeviceManager', () => {
  describe('generateFingerprint', () => {
    it('should generate consistent fingerprint', () => {
      const publicKey = 'test-public-key';
      const fp1 = DeviceManager.generateFingerprint(publicKey);
      const fp2 = DeviceManager.generateFingerprint(publicKey);
      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different keys', () => {
      const fp1 = DeviceManager.generateFingerprint('key1');
      const fp2 = DeviceManager.generateFingerprint('key2');
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('generateChallenge', () => {
    it('should generate unique challenges', () => {
      const c1 = DeviceManager.generateChallenge();
      const c2 = DeviceManager.generateChallenge();
      expect(c1).not.toBe(c2);
    });

    it('should generate 64-character hex string', () => {
      const challenge = DeviceManager.generateChallenge();
      expect(challenge).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate correct number of codes', () => {
      const codes = DeviceManager.generateRecoveryCodes(10);
      expect(codes).toHaveLength(10);
    });

    it('should format codes correctly', () => {
      const codes = DeviceManager.generateRecoveryCodes(1);
      expect(codes[0]).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it('should generate unique codes', () => {
      const codes = DeviceManager.generateRecoveryCodes(10);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('hashRecoveryCode', () => {
    it('should hash recovery code consistently', () => {
      const code = 'ABCD-1234';
      const h1 = DeviceManager.hashRecoveryCode(code);
      const h2 = DeviceManager.hashRecoveryCode(code);
      expect(h1).toBe(h2);
    });
  });

  describe('verifyRecoveryCode', () => {
    it('should verify valid code', () => {
      const code = 'ABCD-1234';
      const hash = DeviceManager.hashRecoveryCode(code);
      const isValid = DeviceManager.verifyRecoveryCode(code, hash);
      expect(isValid).toBe(true);
    });

    it('should reject invalid code', () => {
      const hash = DeviceManager.hashRecoveryCode('ABCD-1234');
      const isValid = DeviceManager.verifyRecoveryCode('WXYZ-5678', hash);
      expect(isValid).toBe(false);
    });
  });
});
