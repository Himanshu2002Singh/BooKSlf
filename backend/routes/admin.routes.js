// /api/admin/* — everything but signing in needs the admin session.
import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

// One allowance shared by everyone: guessing the admin password stays slow.
router.post('/login', rateLimit({ limit: 10, windowMs: 15 * 60_000, key: () => 'admin-login' }), admin.login);
router.post('/logout', admin.logout);
router.use(requireAdmin);
router.get('/overview', admin.overview);
router.get('/readers', admin.readers);
router.put('/themes/:id', admin.setThemePrice);
router.get('/messages', admin.messages);
router.delete('/messages/:id', admin.deleteMessage);
router.get('/reviews', admin.reviews);
router.put('/reviews/:id', admin.featureReview);

export default router;
