import mongoose from 'mongoose';

// A record of one email the mock Gmail service "sent". Mirrors the fields
// that matter from a real Gmail API send response so a real inbox listing
// (or the real API) could populate the same shape later.
const mailMessageSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
    agreement: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },

    role: { type: String, enum: ['Renter', 'Lender'], required: true },
    to: { type: String, required: true },
    toName: { type: String, required: true },
    subject: { type: String, required: true },
    bodyText: { type: String, required: true },
    attachmentName: { type: String, required: true },

    gmailMessageId: { type: String, required: true },
    gmailThreadId: { type: String, required: true },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('MailMessage', mailMessageSchema);
