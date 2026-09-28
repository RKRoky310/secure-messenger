import Foundation
import CryptoKit

/// Handles all cryptographic operations using Apple's CryptoKit
class CryptoService {
    static let shared = CryptoService()
    
    private init() {}
    
    /// Generate identity key pair
    func generateIdentityKeyPair() -> (publicKey: P256.Signing.PublicKey, privateKey: P256.Signing.PrivateKey) {
        let privateKey = P256.Signing.PrivateKey()
        return (publicKey: privateKey.publicKey, privateKey: privateKey)
    }
    
    /// Sign data with private key
    func signData(_ data: Data, using privateKey: P256.Signing.PrivateKey) -> Data {
        let signature = try! privateKey.signature(for: data)
        return signature.rawRepresentation
    }
    
    /// Verify signature
    func verifySignature(_ signature: Data, for data: Data, using publicKey: P256.Signing.PublicKey) -> Bool {
        guard let sig = try? P256.Signing.ECDSASignature(rawRepresentation: signature) else {
            return false
        }
        return publicKey.isValidSignature(sig, for: data)
    }
    
    /// Encrypt message using AES-256-GCM
    func encryptMessage(_ message: String, key: SymmetricKey) -> (ciphertext: Data, nonce: Data)? {
        guard let data = message.data(using: .utf8) else { return nil }
        
        do {
            let sealedBox = try AES.GCM.seal(data, using: key)
            let nonce = sealedBox.nonce.withUnsafeBytes { Data($0) }
            return (ciphertext: sealedBox.ciphertext + sealedBox.tag, nonce: nonce)
        } catch {
            return nil
        }
    }
    
    /// Decrypt message
    func decryptMessage(_ ciphertext: Data, nonce: Data, key: SymmetricKey) -> String? {
        do {
            let nonceValue = try AES.GCM.Nonce(data: nonce)
            let sealedBox = try AES.GCM.SealedBox(nonce: nonceValue, ciphertext: ciphertext.dropLast(16), tag: ciphertext.suffix(16))
            let decrypted = try AES.GCM.open(sealedBox, using: key)
            return String(data: decrypted, encoding: .utf8)
        } catch {
            return nil
        }
    }
    
    /// Generate device fingerprint
    func generateFingerprint(from key: P256.Signing.PublicKey) -> String {
        let data = key.rawRepresentation
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    
    /// Derive key using HKDF
    func deriveKey(from sharedSecret: SharedSecret) -> SymmetricKey {
        return sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: Data(),
            info: "secure-messenger".data(using: .utf8)!,
            outputByteCount: 32
        )
    }
}
