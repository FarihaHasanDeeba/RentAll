import mongoose from 'mongoose';

// The renter <-> lender conversation for one rental. The admin escrow panel
// reads this transcript when a damage claim needs context.
const chatMessageSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['Renter', 'Lender'], required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
