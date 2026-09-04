// ---------------------------------------------------------------------------
// Late Return Fee Generator policy.
//
// Every day (or part of a day) an item is returned past its due date
// (Rental.endDate), the renter is charged an extra day at 1.5x the item's
// daily rate. The fee is withheld from the refundable security deposit and
// can never exceed it - the renter's liability is capped at what's already
// held, not an open-ended charge.
// ---------------------------------------------------------------------------

export const LATE_FEE_MULTIPLIER = 1.5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeLateFee({ dueDate, actualReturnDate, dailyRate, securityDeposit }) {
  const lateMs = new Date(actualReturnDate).getTime() - new Date(dueDate).getTime();
  const daysLate = lateMs > 0 ? Math.ceil(lateMs / MS_PER_DAY) : 0;

  const uncappedFee = daysLate * dailyRate * LATE_FEE_MULTIPLIER;
  const lateFeeAmount = Math.min(uncappedFee, securityDeposit);
  const depositRefundAmount = securityDeposit - lateFeeAmount;

  return { daysLate, lateFeeAmount, depositRefundAmount, isLate: daysLate > 0 };
}
