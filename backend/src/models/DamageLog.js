import mongoose from 'mongoose';

// A damage claim the lender files after inspecting a returned item. The
// admin escrow panel reviews these before deciding how to split the deposit.
const damageLogSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    claimedAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('DamageLog', damageLogSchema);
