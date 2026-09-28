const { secretbox, scalarMult, hash, randomBytes } = require('tweetnacl');
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } = require('tweetnacl-util');

window.crypto = window.crypto || window.msCrypto;

const state = {
  username: '',
  privateKey: null,
  publicKey: null,
  activeUser: '',
  users: [],
  messages: {},
};

const els = {
  usernameInput: document.getElementById('usernameInput'),
  registerBtn: document.getElementById('registerBtn'),
  userList: document.getElementById('userList'),
  messages: document.getElementById('messages'),
  messageForm: document.getElementById('messageForm'),
  messageInput: document.getElementById('messageInput'),
  chatTitle: document.getElementById('chatTitle'),
};

const socket = io();

function toBase64(bytes) {
  return encodeBase64(bytes);
}

function fromBase64(str) {
  return decodeBase64(str);
}

function makeKeyPair() {
  return secretbox.keyPair();
}

function deriveSharedSecret(privateKey, publicKey) {
  const shared = scalarMult(privateKey, publicKey);
  return hash(shared);
}

function getStoredKey(username) {
  return JSON.parse(localStorage.getItem(`secure-messenger:${username}`) || 'null');
}

function saveStoredKey(username, keyPair) {
  localStorage.setItem(
    `secure-messenger:${username}`,
    JSON.stringify({
      publicKey: toBase64(keyPair.publicKey),
      privateKey: toBase64(keyPair.secretKey),
    })
  );
}

async function registerUser() {
  const username = els.usernameInput.value.trim();
  if (!username) {
    alert('Choose a username');
    return;
  }

  let keyPair = getStoredKey(username);
  if (!keyPair) {
    const generated = makeKeyPair();
    keyPair = {
      publicKey: toBase64(generated.publicKey),
      privateKey: toBase64(generated.secretKey),
    };
    saveStoredKey(username, generated);
  }

  state.username = username;
  state.privateKey = fromBase64(keyPair.privateKey);
  state.publicKey = fromBase64(keyPair.publicKey);

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, publicKey: keyPair.publicKey }),
  });

  if (!res.ok) {
    alert('Registration failed');
    return;
  }

  socket.emit('join', username);
  await loadUsers();
  renderUserList();
}

async function loadUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  state.users = users.filter((user) => user.username !== state.username);
  renderUserList();
}

function renderUserList() {
  els.userList.innerHTML = '';

  state.users.forEach((user) => {
    const btn = document.createElement('button');
    btn.className = 'user-item';
    btn.textContent = user.username;
    btn.addEventListener('click', () => {
      state.activeUser = user.username;
      els.chatTitle.textContent = `Chat with ${user.username}`;
      loadMessagesForUser(user.username);
    });
    els.userList.appendChild(btn);
  });
}

async function loadMessagesForUser(username) {
  const res = await fetch(`/api/messages?user=${state.username}`);
  const messages = await res.json();
  const conversation = messages.filter(
    (msg) => msg.from === username || msg.to === username
  );

  state.messages[username] = conversation;
  renderMessages(username);
}

function renderMessages(username) {
  const messages = state.messages[username] || [];
  els.messages.innerHTML = '';

  messages.forEach((msg) => {
    const entry = document.createElement('div');
    const isOwn = msg.from === state.username;
    const text = decryptMessage(msg);

    entry.className = `message ${isOwn ? 'mine' : 'theirs'}`;
    entry.innerHTML = `<strong>${isOwn ? 'You' : msg.from}</strong><p>${text}</p>`;
    els.messages.appendChild(entry);
  });

  els.messages.scrollTop = els.messages.scrollHeight;
}

function encryptMessage(message, recipientPublicKey) {
  const nonce = randomBytes(24);
  const sharedSecret = deriveSharedSecret(state.privateKey, fromBase64(recipientPublicKey));
  const key = sharedSecret;
  const encrypted = secretbox.encode(
    secretbox.encrypt(decodeUTF8(message), nonce, key)
  );

  return {
    ciphertext: toBase64(encrypted.ciphertext),
    nonce: toBase64(encrypted.nonce),
  };
}

function decryptMessage(msg) {
  try {
    const senderPublicKey = fromBase64(msg.senderPublicKey || state.publicKey);
    const sharedSecret = deriveSharedSecret(state.privateKey, senderPublicKey);
    const nonce = fromBase64(msg.nonce);
    const ciphertext = fromBase64(msg.ciphertext);
    const plaintext = secretbox.open(ciphertext, nonce, sharedSecret);

    if (!plaintext) {
      return '[Unable to decrypt]';
    }

    return decodeUTF8(plaintext);
  } catch (error) {
    return '[Unable to decrypt]';
  }
}

els.registerBtn.addEventListener('click', registerUser);

els.messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.username || !state.activeUser) {
    alert('Select a user to chat with');
    return;
  }

  const message = els.messageInput.value.trim();
  if (!message) return;

  const recipient = state.users.find((user) => user.username === state.activeUser);
  if (!recipient) {
    alert('Recipient not found');
    return;
  }

  const { ciphertext, nonce } = encryptMessage(message, recipient.publicKey);

  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: state.username,
      to: state.activeUser,
      ciphertext,
      nonce,
      senderPublicKey: toBase64(state.publicKey),
      timestamp: Date.now(),
    }),
  });

  if (!res.ok) {
    alert('Message failed to send');
    return;
  }

  const payload = await res.json();
  if (!state.messages[state.activeUser]) {
    state.messages[state.activeUser] = [];
  }
  state.messages[state.activeUser].push(payload.message);
  renderMessages(state.activeUser);
  els.messageInput.value = '';
});

socket.on('users:update', async () => {
  await loadUsers();
});

socket.on('message:incoming', (payload) => {
  if (payload.to !== state.username) return;

  if (!state.messages[payload.from]) {
    state.messages[payload.from] = [];
  }

  state.messages[payload.from].push(payload);
  renderMessages(payload.from);
});

window.addEventListener('load', () => {
  loadUsers();
});


