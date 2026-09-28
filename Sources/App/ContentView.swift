import SwiftUI

struct ContentView: View {
    @State private var username = ""
    @State private var isRegistering = false
    @State private var isAuthenticated = false
    
    var body: some View {
        if isAuthenticated {
            ChatView()
        } else {
            AuthView(
                username: $username,
                isRegistering: $isRegistering,
                isAuthenticated: $isAuthenticated
            )
        }
    }
}

struct AuthView: View {
    @Binding var username: String
    @Binding var isRegistering: Bool
    @Binding var isAuthenticated: Bool
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Secure Messenger")
                    .font(.system(size: 28, weight: .bold))
                Text("End-to-end encrypted messaging")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(.gray)
            }
            .padding(.top, 40)
            
            VStack(spacing: 12) {
                TextField("Username", text: $username)
                    .textFieldStyle(.roundedBorder)
                    .disabled(isRegistering)
                
                Button(action: handleRegister) {
                    if isRegistering {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Register")
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
                .disabled(isRegistering || username.isEmpty)
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .background(Color(.systemBackground))
    }
    
    private func handleRegister() {
        isRegistering = true
        // Registration logic here
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isAuthenticated = true
            isRegistering = false
        }
    }
}

struct ChatView: View {
    var body: some View {
        VStack {
            Text("Chat Interface")
                .font(.headline)
            Text("Coming Soon")
                .foregroundColor(.gray)
            Spacer()
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
