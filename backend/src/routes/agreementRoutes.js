import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { streamAgreementPdf } from '../controllers/agreementController.js';

const router = Router();

router.get('/:id/pdf', asyncHandler(streamAgreementPdf));

export default router;
