import Rental from '../models/Rental.js';
import { computeLateFee } from '../services/lateFeeService.js';

const ALREADY_RETURNED_STATUSES = ['Returned', 'Checked & Approved', 'Cancelled'];

// GET /api/rentals - minimal listing so the demo UI has something to check out.
export async function listRentals(req, res) {
  const rentals = await Rental.find()
    .populate('item', 'title dailyRate securityDeposit')
    .populate('renter', 'name email')
    .sort({ createdAt: -1 });
  res.json(rentals);
}

// GET /api/rentals/:id
export async function getRental(req, res) {
  const rental = await Rental.findById(req.params.id)
    .populate('item', 'title dailyRate securityDeposit')
    .populate('renter', 'name email')
    .populate('lender', 'name email');
  if (!rental) return res.status(404).json({ message: 'Rental not found' });
  res.json(rental);
}

// GET /api/rentals/:id/return-preview?at=<ISO timestamp>
// Live "what would the late fee be right now" calculation, used by the
// return form while the renter/lender is still picking a return time.
export async function previewReturn(req, res) {
  const rental = await Rental.findById(req.params.id).populate('item', 'title');
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  const actualReturnDate = req.query.at ? new Date(req.query.at) : new Date();
  if (Number.isNaN(actualReturnDate.getTime())) {
    return res.status(400).json({ message: 'Invalid "at" timestamp' });
  }

  const result = computeLateFee({
    dueDate: rental.endDate,
    actualReturnDate,
    dailyRate: rental.dailyRate,
    securityDeposit: rental.securityDeposit,
  });

  res.json({ ...result, actualReturnDate, dueDate: rental.endDate });
}

// POST /api/rentals/:id/return { actualReturnDate? }
// Marks the item returned and permanently records the late fee deduction.
export async function confirmReturn(req, res) {
  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  if (rental.paymentStatus !== 'Paid') {
    return res.status(409).json({ message: 'Rental must be paid before it can be returned' });
  }
  if (ALREADY_RETURNED_STATUSES.includes(rental.status)) {
    return res.status(409).json({ message: 'This rental has already been returned' });
  }

  const actualReturnDate = req.body.actualReturnDate ? new Date(req.body.actualReturnDate) : new Date();
  if (Number.isNaN(actualReturnDate.getTime())) {
    return res.status(400).json({ message: 'Invalid actualReturnDate' });
  }

  const { daysLate, lateFeeAmount, depositRefundAmount } = computeLateFee({
    dueDate: rental.endDate,
    actualReturnDate,
    dailyRate: rental.dailyRate,
    securityDeposit: rental.securityDeposit,
  });

  rental.status = 'Returned';
  rental.actualReturnDate = actualReturnDate;
  rental.daysLate = daysLate;
  rental.lateFeeAmount = lateFeeAmount;
  rental.depositRefundAmount = depositRefundAmount;
  await rental.save();
  await rental.populate('item', 'title dailyRate securityDeposit');

  res.json(rental);
}
