import express from 'express';
import { query } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// List user devices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await query(
      'SELECT id, device_name, fingerprint, is_verified, last_activity, created_at FROM devices WHERE user_id = $1',
      [userId]
    );

    res.json({ devices: result.rows });
  } catch (error) {
    logger.error('Devices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Verify device
router.patch('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    await query(
      'UPDATE devices SET is_verified = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ status: 'device verified' });
  } catch (error) {
    logger.error('Device verify error:', error);
    res.status(500).json({ error: 'Failed to verify device' });
  }
});

// Revoke device
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    await query('DELETE FROM devices WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ status: 'device revoked' });
  } catch (error) {
    logger.error('Device revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke device' });
  }
});

export default router;
