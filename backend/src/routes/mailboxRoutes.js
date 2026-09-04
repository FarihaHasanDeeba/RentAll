import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listMailbox, getMailMessage } from '../controllers/agreementController.js';

const router = Router();

router.get('/', asyncHandler(listMailbox));
router.get('/:id', asyncHandler(getMailMessage));

export default router;
