import { useEffect, useState } from 'react';
import { db } from './db';
import CryptoManager from './crypto';
import apiClient from './api/client';
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user has existing credentials
      const token = localStorage.getItem('auth-token');
      const storedUsername = localStorage.getItem('username');

      if (token && storedUsername) {
        setUsername(storedUsername);
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      setIsInitialized(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // Generate identity key pair
      const keyPair = await CryptoManager.generateIdentityKeyPair();

      // Register with backend
      const response = await apiClient.register(username, keyPair.publicKey);

      // Store credentials
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('username', username);
      localStorage.setItem(
        'private-key',
        Array.from(keyPair.privateKey).join(',')
      );

      setIsInitialized(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isInitialized) {
    return <div className="loader">Loading...</div>;
  }

  if (!username) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Secure Messenger</h1>
          <p>End-to-end encrypted messaging</p>

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isRegistering}
            />
            <button type="submit" disabled={isRegistering}>
              {isRegistering ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Secure Messenger</h1>
        <p>Logged in as {username}</p>
      </header>
      <main className="app-main">
        <div className="placeholder">
          <p>Chat interface coming soon...</p>
          <p>Your messages are encrypted end-to-end</p>
        </div>
      </main>
    </div>
  );
}

export default App;
