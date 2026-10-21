// Every API endpoint, mounted under /api by app.js.
import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import bookRoutes from './books.routes.js';
import goodreadsRoutes from './goodreads.routes.js';
import meRoutes from './me.routes.js';
import messageRoutes from './message.routes.js';
import paymentRoutes from './payment.routes.js';
import shelfRoutes from './shelf.routes.js';
import themeRoutes from './theme.routes.js';
import usernameRoutes from './username.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/usernames', usernameRoutes);
router.use('/shelves', shelfRoutes);
router.use('/goodreads', goodreadsRoutes);
router.use('/books', bookRoutes);
router.use('/payments', paymentRoutes);
router.use('/themes', themeRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);

export default router;
