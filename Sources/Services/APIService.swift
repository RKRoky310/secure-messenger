import Foundation
import Combine

/// API client for secure communication with backend
class APIService {
    static let shared = APIService()
    
    private let session: URLSession
    private let baseURL = URL(string: "https://api.securemessenger.app")!
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.waitsForConnectivity = true
        config.tlsMinimumSupportedProtocolVersion = .TLSv13
        
        self.session = URLSession(configuration: config)
    }
    
    /// Register new device
    func register(
        username: String,
        identityKey: Data
    ) -> AnyPublisher<(token: String, userId: String), Error> {
        let endpoint = baseURL.appendingPathComponent("auth/register")
        
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "username": username,
            "identityKey": identityKey.base64EncodedString()
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        return session.dataTaskPublisher(for: request)
            .mapError { $0 as Error }
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200..<300).contains(httpResponse.statusCode) else {
                    throw APIError.invalidResponse
                }
                
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let token = json?["token"] as? String,
                      let userId = json?["userId"] as? String else {
                    throw APIError.decodingError
                }
                
                return (token: token, userId: userId)
            }
            .eraseToAnyPublisher()
    }
    
    /// Send encrypted message
    func sendMessage(
        to: String,
        ciphertext: Data,
        nonce: Data
    ) -> AnyPublisher<String, Error> {
        let endpoint = baseURL.appendingPathComponent("messages")
        
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(retrieveToken())", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "to": to,
            "ciphertext": ciphertext.base64EncodedString(),
            "nonce": nonce.base64EncodedString()
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        return session.dataTaskPublisher(for: request)
            .mapError { $0 as Error }
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200..<300).contains(httpResponse.statusCode) else {
                    throw APIError.invalidResponse
                }
                
                let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let messageId = json?["id"] as? String else {
                    throw APIError.decodingError
                }
                
                return messageId
            }
            .eraseToAnyPublisher()
    }
    
    /// Fetch messages
    func fetchMessages() -> AnyPublisher<[[String: Any]], Error> {
        let endpoint = baseURL.appendingPathComponent("messages")
        
        var request = URLRequest(url: endpoint)
        request.httpMethod = "GET"
        request.setValue("Bearer \(retrieveToken())", forHTTPHeaderField: "Authorization")
        
        return session.dataTaskPublisher(for: request)
            .mapError { $0 as Error }
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse,
                      (200..<300).contains(httpResponse.statusCode) else {
                    throw APIError.invalidResponse
                }
                
                let json = try JSONSerialization.jsonObject(with: data) as? [[String: Any]]
                return json ?? []
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func retrieveToken() -> String {
        UserDefaults.standard.string(forKey: "auth-token") ?? ""
    }
}

enum APIError: Error {
    case invalidResponse
    case decodingError
    case networkError
}
