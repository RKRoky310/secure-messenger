import express from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Upload identity key
router.post('/identity', authenticateToken, async (req, res) => {
  try {
    const { publicKey } = req.body;
    const { userId } = req.user;

    if (!publicKey) {
      return res.status(400).json({ error: 'Public key required' });
    }

    await query('UPDATE users SET identity_key = $1 WHERE id = $2', [
      Buffer.from(publicKey, 'base64'),
      userId,
    ]);

    res.json({ status: 'identity key uploaded' });
  } catch (error) {
    logger.error('Key upload error:', error);
    res.status(500).json({ error: 'Failed to upload key' });
  }
});

// Fetch prekeys
router.get('/prekeys/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { count = 10 } = req.query;

    const result = await query(
      'SELECT id, public_key FROM prekeys WHERE user_id = $1 AND is_used = false LIMIT $2',
      [userId, parseInt(count)]
    );

    const prekeys = result.rows.map((pk) => ({
      id: pk.id,
      publicKey: pk.public_key.toString('base64'),
    }));

    res.json({ prekeys });
  } catch (error) {
    logger.error('Prekey fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prekeys' });
  }
});

// Upload prekeys
router.post('/prekeys', authenticateToken, async (req, res) => {
  try {
    const { prekeys } = req.body;
    const { userId } = req.user;

    if (!prekeys || !Array.isArray(prekeys)) {
      return res.status(400).json({ error: 'Invalid prekeys format' });
    }

    for (const pk of prekeys) {
      await query(
        'INSERT INTO prekeys (user_id, public_key) VALUES ($1, $2)',
        [userId, Buffer.from(pk.publicKey, 'base64')]
      );
    }

    res.status(201).json({ status: 'prekeys uploaded', count: prekeys.length });
  } catch (error) {
    logger.error('Prekey upload error:', error);
    res.status(500).json({ error: 'Failed to upload prekeys' });
  }
});

export default router;
