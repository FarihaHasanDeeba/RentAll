import mongoose from 'mongoose';

// A record of one text the mock SMS gateway "sent". Mirrors the fields that
// matter from a real SMS provider's message resource (Twilio-shaped: sid,
// status, to, body) so a real provider could populate the same shape later.
const smsMessageSchema = new mongoose.Schema(
  {
    rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
    to: { type: String, required: true },
    toName: { type: String, required: true },
    body: { type: String, required: true },
    hoursBeforeDue: { type: Number, required: true },

    providerSid: { type: String, required: true },
    status: { type: String, default: 'sent' },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('SmsMessage', smsMessageSchema);
