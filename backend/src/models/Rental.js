import mongoose from 'mongoose';

// Structural states from the project overview. Payment Operations only
// drives paymentStatus; the Requested -> ... -> Checked & Approved lifecycle
// belongs to other modules built later.
const RENTAL_STATUSES = [
  'Requested',
  'Checked Out',
  'In Use',
  'Returned',
  'Checked & Approved',
  'Cancelled',
];

const rentalSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },

    // Snapshots of the item's pricing at booking time, so later price
    // changes on the Item don't retroactively change an existing rental.
    dailyRate: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    rentalCost: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    status: { type: String, enum: RENTAL_STATUSES, default: 'Requested' },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Tracks the refundable security deposit separately from paymentStatus:
    // 'held' from the moment payment completes; resolved to 'refunded' /
    // 'partially_refunded' / 'deducted' once the admin escrow panel settles it.
    securityDepositStatus: {
      type: String,
      enum: ['pending', 'held', 'refunded', 'partially_refunded', 'deducted'],
      default: 'pending',
    },

    // Populated when the item is marked Returned. daysLate/lateFeeAmount
    // come from the Late Return Fee Generator; depositRefundAmount is what's
    // left of the security deposit after that fee is deducted.
    actualReturnDate: { type: Date },
    daysLate: { type: Number, default: 0 },
    lateFeeAmount: { type: Number, default: 0 },
    depositRefundAmount: { type: Number },

    // Set once the Return Window SMS Reminder has gone out, so the
    // scheduler never texts the same rental twice.
    returnReminderSentAt: { type: Date },

    // Set once the admin escrow panel distributes the held deposit. Moves
    // the rental into its final 'Checked & Approved' state.
    settlement: { type: mongoose.Schema.Types.ObjectId, ref: 'Settlement' },
  },
  { timestamps: true }
);

export const RENTAL_STATUS_VALUES = RENTAL_STATUSES;
export default mongoose.model('Rental', rentalSchema);
