import Foundation
import Security
import LocalAuthentication

/// Manages secure key storage in Keychain and Secure Enclave
class KeychainService {
    static let shared = KeychainService()
    
    private let keychain = SecureEnclave.P256.Signing.self
    private let context = LAContext()
    
    private init() {
        context.localizedReason = "Unlock Secure Messenger"
    }
    
    /// Store private key in Secure Enclave
    func storePrivateKey(_ key: P256.Signing.PrivateKey, withLabel label: String) -> Bool {
        let keyData = key.withUnsafeBytes { Data($0) }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationLabel as String: label,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPr1,
            kSecAttrKeyClass as String: kSecAttrKeyClassPrivate,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            kSecAttrAccessControl as String: createAccessControl()
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    /// Retrieve private key from Keychain
    func retrievePrivateKey(withLabel label: String) -> P256.Signing.PrivateKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationLabel as String: label,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let keyData = result as? Data else {
            return nil
        }
        
        return try? P256.Signing.PrivateKey(rawRepresentation: keyData)
    }
    
    /// Store data in encrypted keychain
    func storeData(_ data: Data, forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    /// Retrieve data from keychain
    func retrieveData(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        return status == errSecSuccess ? result as? Data : nil
    }
    
    /// Delete item from keychain
    func deleteItem(forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
    
    /// Authenticate with biometric
    func authenticateWithBiometric(completion: @escaping (Bool) -> Void) {
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            completion(false)
            return
        }
        
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Unlock Secure Messenger") { success, _ in
            DispatchQueue.main.async {
                completion(success)
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func createAccessControl() -> SecAccessControl? {
        var error: Unmanaged<CFError>?
        let flags: SecAccessControlCreateFlags = [.privateKeyUsage, .userPresence]
        
        return SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            flags,
            &error
        )
    }
}
