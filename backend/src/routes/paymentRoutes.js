import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  initiatePayment,
  getPaymentByTranId,
  confirmMockPayment,
  cancelMockPayment,
  failMockPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/initiate', asyncHandler(initiatePayment));
router.get('/tran/:tranId', asyncHandler(getPaymentByTranId));
router.post('/mock-gateway/:tranId/confirm', asyncHandler(confirmMockPayment));
router.post('/mock-gateway/:tranId/cancel', asyncHandler(cancelMockPayment));
router.post('/mock-gateway/:tranId/fail', asyncHandler(failMockPayment));

export default router;
