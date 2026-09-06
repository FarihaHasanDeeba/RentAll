const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["RENTER", "LENDER"],
            required: true
        },

        location: {
            address: String,
            latitude: Number,
            longitude: Number
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);