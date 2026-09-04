import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    role: { type: String, enum: ['Renter', 'Lender', 'Both'], default: 'Both' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
