const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    dropOffLocation: {
      type: String,
      default: "",
    },

    accountType: {
      type: String,
      enum: ["renter", "lender"],
      required: true,
    },

    bankDetails: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    identityVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);

module.exports = user;