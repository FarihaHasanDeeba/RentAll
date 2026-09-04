import mongoose from 'mongoose';

// The admin's final decision on how to split the held security deposit
// (after the Late Return Fee Generator's deduction) between the two parties.
// amountToRenter + amountToLender always equals depositHeld.
const settlementSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true, unique: true },
    depositHeld: { type: Number, required: true },
    amountToRenter: { type: Number, required: true },
    amountToLender: { type: Number, required: true },
    adminNote: { type: String, default: '' },
    settledAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Settlement', settlementSchema);
