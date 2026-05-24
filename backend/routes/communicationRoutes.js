import express from 'express';
import { addLog, getLogsByLead, getUpcomingFollowUps, toggleFollowUpComplete } from '../controllers/communicationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addLog);

router.route('/followups')
  .get(protect, getUpcomingFollowUps);

router.route('/lead/:leadId')
  .get(protect, getLogsByLead);

router.route('/followup/:id/toggle')
  .put(protect, toggleFollowUpComplete);

export default router;
