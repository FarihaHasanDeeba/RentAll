import Rental from '../models/Rental.js';
import Settlement from '../models/Settlement.js';

const SETTLEABLE_STATUSES = ['Returned'];

// Splits the deposit left after the Late Return Fee Generator's deduction
// between the renter (refund) and the lender (damage compensation). The
// admin decides amountToRenter; the rest of the held deposit goes to the
// lender - the two always sum to exactly what's held, no more, no less.
export async function settleRental(rentalId, { amountToRenter, adminNote = '' }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw Object.assign(new Error('Rental not found'), { status: 404 });

  if (!SETTLEABLE_STATUSES.includes(rental.status)) {
    throw Object.assign(
      new Error('Only a Returned rental (not yet settled) can be settled'),
      { status: 409 }
    );
  }

  const depositHeld = rental.depositRefundAmount;
  if (amountToRenter < 0 || amountToRenter > depositHeld) {
    throw Object.assign(
      new Error(`amountToRenter must be between 0 and the held deposit (${depositHeld})`),
      { status: 400 }
    );
  }

  const amountToLender = depositHeld - amountToRenter;

  const settlement = await Settlement.create({
    rental: rental._id,
    depositHeld,
    amountToRenter,
    amountToLender,
    adminNote,
    settledAt: new Date(),
  });

  let securityDepositStatus;
  if (amountToRenter === 0) securityDepositStatus = 'deducted';
  else if (amountToRenter === depositHeld) securityDepositStatus = 'refunded';
  else securityDepositStatus = 'partially_refunded';

  rental.settlement = settlement._id;
  rental.status = 'Checked & Approved';
  rental.paymentStatus = 'Refunded';
  rental.securityDepositStatus = securityDepositStatus;
  await rental.save();

  return settlement;
}
