const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const messages = new Map();

function safeUser(user) {
  return {
    username: user.username,
    publicKey: user.publicKey,
    createdAt: user.createdAt,
  };
}

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()).map(safeUser));
});

app.get('/api/users/:username', (req, res) => {
  const user = users.get(req.params.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(safeUser(user));
});

app.post('/api/register', (req, res) => {
  const { username, publicKey } = req.body || {};

  if (!username || !publicKey) {
    return res.status(400).json({ error: 'Username and public key are required.' });
  }

  if (users.has(username)) {
    users.set(username, { username, publicKey, createdAt: Date.now() });
    return res.json({ success: true, user: safeUser(users.get(username)) });
  }

  users.set(username, { username, publicKey, createdAt: Date.now() });
  io.emit('users:update', Array.from(users.values()).map(safeUser));
  return res.status(201).json({ success: true, user: safeUser(users.get(username)) });
});

app.get('/api/messages', (req, res) => {
  const user = req.query.user;
  if (!user) {
    return res.status(400).json({ error: 'Missing user query parameter' });
  }

  const list = (messages.get(user) || []).map((msg) => ({
    ...msg,
    direction: msg.to === user ? 'incoming' : 'outgoing',
  }));

  return res.json(list);
});

app.post('/api/messages', (req, res) => {
  const { from, to, ciphertext, nonce, senderPublicKey, timestamp } = req.body || {};

  if (!from || !to || !ciphertext || !nonce || !senderPublicKey) {
    return res.status(400).json({ error: 'Incomplete message payload' });
  }

  if (!users.has(to) || !users.has(from)) {
    return res.status(404).json({ error: 'Sender or recipient is not registered' });
  }

  const payload = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from,
    to,
    ciphertext,
    nonce,
    senderPublicKey,
    timestamp: timestamp || Date.now(),
  };

  const senderMessages = messages.get(from) || [];
  const recipientMessages = messages.get(to) || [];

  senderMessages.push({ ...payload, outgoing: true });
  recipientMessages.push({ ...payload, outgoing: false });

  messages.set(from, senderMessages);
  messages.set(to, recipientMessages);

  io.to(to).emit('message:incoming', payload);
  return res.status(201).json({ success: true, message: payload });
});

io.on('connection', (socket) => {
  socket.emit('users:update', Array.from(users.values()).map(safeUser));

  socket.on('join', (username) => {
    if (!username) return;
    socket.join(username);
    socket.emit('joined', username);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Secure Messenger server running at http://localhost:${PORT}`);
});
