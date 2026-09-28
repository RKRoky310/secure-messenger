import Foundation
import Combine

/// Main authentication view model
class AuthViewModel: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var errorMessage: String?
    @Published var isLoading = false
    
    private let keychain = KeychainService.shared
    private let api = APIService.shared
    private let crypto = CryptoService.shared
    
    func register(username: String) {
        isLoading = true
        
        // Generate identity key pair
        let (publicKey, privateKey) = crypto.generateIdentityKeyPair()
        
        // Store private key in Keychain
        let success = keychain.storePrivateKey(privateKey, withLabel: "identity-key-\(username)")
        guard success else {
            errorMessage = "Failed to store keys"
            isLoading = false
            return
        }
        
        // Register with server
        let publicKeyData = publicKey.rawRepresentation
        
        _ = api.register(username: username, identityKey: publicKeyData)
            .sink { [weak self] completion in
                switch completion {
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                case .finished:
                    break
                }
                self?.isLoading = false
            } receiveValue: { [weak self] response in
                UserDefaults.standard.set(response.token, forKey: "auth-token")
                UserDefaults.standard.set(response.userId, forKey: "user-id")
                UserDefaults.standard.set(username, forKey: "username")
                self?.isAuthenticated = true
            }
    }
}
