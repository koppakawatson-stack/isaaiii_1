import express from 'express';
import { scoreLead, generateEmail } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/score/:leadId', protect, scoreLead);
router.post('/email', protect, generateEmail);

export default router;
