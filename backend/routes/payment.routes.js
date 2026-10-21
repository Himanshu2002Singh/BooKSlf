// /api/payments
import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';
import { requireUser } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/order', requireUser, createOrder);
router.post('/verify', requireUser, verifyPayment);

export default router;
