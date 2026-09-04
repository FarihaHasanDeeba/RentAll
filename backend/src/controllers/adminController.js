import Rental from '../models/Rental.js';
import DamageLog from '../models/DamageLog.js';
import ChatMessage from '../models/ChatMessage.js';
import Settlement from '../models/Settlement.js';
import { settleRental } from '../services/settlementService.js';

const REVIEWABLE_STATUSES = ['Returned', 'Checked & Approved'];

// GET /api/admin/rentals
// Every rental that has made it through a return, with enough context to
// triage which ones actually need admin attention (has a damage claim,
// hasn't been settled yet) vs which are routine.
export async function listReturnedRentals(req, res) {
  const rentals = await Rental.find({ status: { $in: REVIEWABLE_STATUSES } })
    .populate('item', 'title')
    .populate('renter', 'name')
    .populate('lender', 'name')
    .sort({ actualReturnDate: -1 });

  const rentalIds = rentals.map((r) => r._id);
  const [damageCounts, messageCounts] = await Promise.all([
    DamageLog.aggregate([{ $match: { rental: { $in: rentalIds } } }, { $group: { _id: '$rental', count: { $sum: 1 } } }]),
    ChatMessage.aggregate([{ $match: { rental: { $in: rentalIds } } }, { $group: { _id: '$rental', count: { $sum: 1 } } }]),
  ]);
  const damageMap = new Map(damageCounts.map((d) => [d._id.toString(), d.count]));
  const messageMap = new Map(messageCounts.map((m) => [m._id.toString(), m.count]));

  res.json(
    rentals.map((r) => ({
      ...r.toObject(),
      damageLogCount: damageMap.get(r._id.toString()) || 0,
      messageCount: messageMap.get(r._id.toString()) || 0,
    }))
  );
}

// GET /api/admin/rentals/:id
export async function getRentalForReview(req, res) {
  const rental = await Rental.findById(req.params.id)
    .populate('item', 'title dailyRate securityDeposit')
    .populate('renter', 'name email phone')
    .populate('lender', 'name email phone');
  if (!rental) return res.status(404).json({ message: 'Rental not found' });
  if (!REVIEWABLE_STATUSES.includes(rental.status)) {
    return res.status(409).json({ message: 'This rental has not been returned yet' });
  }

  const [damageLogs, messages, settlement] = await Promise.all([
    DamageLog.find({ rental: rental._id }).populate('reportedBy', 'name role').sort({ createdAt: 1 }),
    ChatMessage.find({ rental: rental._id }).populate('sender', 'name').sort({ createdAt: 1 }),
    Settlement.findOne({ rental: rental._id }),
  ]);

  res.json({ rental, damageLogs, messages, settlement });
}

// POST /api/admin/rentals/:id/settle { amountToRenter, adminNote }
export async function settle(req, res) {
  const { amountToRenter, adminNote } = req.body;
  if (typeof amountToRenter !== 'number') {
    return res.status(400).json({ message: 'amountToRenter (number) is required' });
  }
  const settlement = await settleRental(req.params.id, { amountToRenter, adminNote });
  res.status(201).json(settlement);
}
