// /api/themes
import { Router } from 'express';
import { getPrices } from '../controllers/theme.controller.js';

const router = Router();

router.get('/prices', getPrices);

export default router;
