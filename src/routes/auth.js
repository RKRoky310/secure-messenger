import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { generateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, identityKey } = req.body;

    if (!username || !identityKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = uuidv4();
    const deviceId = uuidv4();

    // Insert user
    await query(
      'INSERT INTO users (id, username, email, identity_key) VALUES ($1, $2, $3, $4)',
      [userId, username, email || null, Buffer.from(identityKey, 'base64')]
    );

    // Insert device
    await query(
      'INSERT INTO devices (id, user_id, device_name, is_verified) VALUES ($1, $2, $3, $4)',
      [deviceId, userId, 'Primary Device', true]
    );

    const token = generateToken(userId, deviceId);

    logger.info(`User registered: ${username}`);

    res.status(201).json({
      token,
      user: { id: userId, username, email },
      device: { id: deviceId },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const result = await query('SELECT id FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userId = result.rows[0].id;
    const deviceId = uuidv4();

    const token = generateToken(userId, deviceId);

    res.json({ token, user: { id: userId, username } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
