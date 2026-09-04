import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listReturnedRentals, getRentalForReview, settle } from '../controllers/adminController.js';

const router = Router();

router.get('/rentals', asyncHandler(listReturnedRentals));
router.get('/rentals/:id', asyncHandler(getRentalForReview));
router.post('/rentals/:id/settle', asyncHandler(settle));

export default router;
