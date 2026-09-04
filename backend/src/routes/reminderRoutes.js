import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { runReminderSweep, listReminders } from '../controllers/reminderController.js';

const router = Router();

router.get('/', asyncHandler(listReminders));
router.post('/run', asyncHandler(runReminderSweep));

export default router;
