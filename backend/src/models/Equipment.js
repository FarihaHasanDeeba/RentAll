const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
    {
        name: {
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

        pricePerDay: {
            type: Number,
            required: true,
            min: 0
        },

        location: {
            type: String,
            required: true
        },

        availability: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Equipment", equipmentSchema);