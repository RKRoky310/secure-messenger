import express from 'express';
import authRoutes from './auth.js';
import messageRoutes from './messages.js';
import keyRoutes from './keys.js';
import deviceRoutes from './devices.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);
router.use('/keys', keyRoutes);
router.use('/devices', deviceRoutes);

export default router;
