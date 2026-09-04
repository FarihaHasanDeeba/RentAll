import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
    dailyRate: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, default: 'Dhaka' },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
