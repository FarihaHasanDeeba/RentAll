import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listRentals, getRental, previewReturn, confirmReturn } from '../controllers/rentalController.js';
import { sendAgreement, getAgreementForRental } from '../controllers/agreementController.js';
import { getReminderForRental } from '../controllers/reminderController.js';
import { listDamageLogs, createDamageLog, listMessages, createMessage } from '../controllers/disputeController.js';

const router = Router();

router.get('/', asyncHandler(listRentals));
router.get('/:id', asyncHandler(getRental));
router.get('/:id/return-preview', asyncHandler(previewReturn));
router.post('/:id/return', asyncHandler(confirmReturn));
router.get('/:id/agreement', asyncHandler(getAgreementForRental));
router.post('/:id/agreement/send', asyncHandler(sendAgreement));
router.get('/:id/reminder', asyncHandler(getReminderForRental));
router.get('/:id/damage-logs', asyncHandler(listDamageLogs));
router.post('/:id/damage-logs', asyncHandler(createDamageLog));
router.get('/:id/messages', asyncHandler(listMessages));
router.post('/:id/messages', asyncHandler(createMessage));

export default router;
