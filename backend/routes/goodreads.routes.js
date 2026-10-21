// /api/goodreads
import { Router } from 'express';
import { connect, sync } from '../controllers/goodreads.controller.js';
import { requireUser } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Each read of a profile is up to 20 Goodreads requests, so readers get a modest allowance.
const goodreadsLimit = rateLimit({ limit: 15, windowMs: 10 * 60_000 });

router.put('/', requireUser, goodreadsLimit, connect);
router.post('/sync', requireUser, goodreadsLimit, sync);

export default router;
