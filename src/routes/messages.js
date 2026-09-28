import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { to, ciphertext, senderKey, nonce } = req.body;
    const { userId } = req.user;

    if (!to || !ciphertext || !senderKey || !nonce) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify recipient exists
    const recipientResult = await query('SELECT id FROM users WHERE username = $1', [to]);
    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipientId = recipientResult.rows[0].id;
    const messageId = uuidv4();

    await query(
      'INSERT INTO messages (id, sender_id, recipient_id, ciphertext, sender_key, nonce) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        messageId,
        userId,
        recipientId,
        Buffer.from(ciphertext, 'base64'),
        Buffer.from(senderKey, 'base64'),
        Buffer.from(nonce, 'base64'),
      ]
    );

    logger.info(`Message sent from ${userId} to ${recipientId}`);

    res.status(201).json({ id: messageId, status: 'sent' });
  } catch (error) {
    logger.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Fetch messages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, sender_id, ciphertext, sender_key, nonce, created_at, is_read
       FROM messages
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const messages = result.rows.map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      ciphertext: msg.ciphertext.toString('base64'),
      senderKey: msg.sender_key.toString('base64'),
      nonce: msg.nonce.toString('base64'),
      createdAt: msg.created_at,
      isRead: msg.is_read,
    }));

    res.json({ messages, count: messages.length });
  } catch (error) {
    logger.error('Message fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark message as read
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    await query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2',
      [id, userId]
    );

    res.json({ status: 'marked as read' });
  } catch (error) {
    logger.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

export default router;
