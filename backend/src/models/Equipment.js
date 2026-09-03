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

        securityDeposit: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        condition: {
            type: String,
            required: true,
            trim: true
        },

        images: {
            type: [String],
            default: []
        },

        userManual: {
            type: String,
            default: ""
        },

        safetyInstructions: {
            type: String,
            default: ""
        },

        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        reviews: {
            type: [String],
            default: []
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

module.exports = mongoose.model(
    "Equipment",
    equipmentSchema
);