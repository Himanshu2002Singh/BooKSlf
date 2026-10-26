// /api/reviews
import { Router } from 'express';
import { featured } from '../controllers/review.controller.js';

const router = Router();

router.get('/', featured);

export default router;
