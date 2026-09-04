import mongoose from 'mongoose';

// One issued rental agreement per rental. Re-issuing (resend) overwrites the
// PDF in place - the MailMessage records are what keep the send history.
const agreementSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true, unique: true },
    pdf: { type: Buffer, required: true },
    fileName: { type: String, required: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Agreement', agreementSchema);
