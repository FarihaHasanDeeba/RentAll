const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        rentalPricePerDay: {
            type: Number,
            required: true,
            min: 0
        },

        securityDeposit: {
            type: Number,
            required: true,
            min: 0
        },

        images: [
            {
                type: String
            }
        ],

        location: {
            address: String,
            latitude: Number,
            longitude: Number
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Item", itemSchema);