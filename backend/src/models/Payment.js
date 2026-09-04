import mongoose from 'mongoose';

// Mirrors the shape of an SSLCommerz transaction record so swapping the
// mock gateway for the real `sslcommerz-lts` SDK later doesn't require a
// schema change - only sslcommerzMockService.js changes.
const paymentSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    tranId: { type: String, required: true, unique: true },
    sessionKey: { type: String, required: true },
    valId: { type: String },

    // Two-tier breakdown: the rental cost is the platform/lender's earned
    // revenue, the security deposit is held and refundable on safe return.
    rentalAmount: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },

    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },

    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
