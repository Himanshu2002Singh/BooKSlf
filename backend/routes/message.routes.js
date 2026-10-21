// /api/messages
import { Router } from 'express';
import { send } from '../controllers/message.controller.js';
import { loadUser } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Visitors needn't be signed in, so they share one allowance (IP addresses are shared too).
router.post('/', loadUser, rateLimit({ limit: 30, windowMs: 60_000, key: () => 'landing-forms' }), send);

export default router;
