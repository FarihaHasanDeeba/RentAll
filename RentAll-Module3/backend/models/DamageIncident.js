const mongoose = require("mongoose");

const damageIncidentSchema = new mongoose.Schema(
    {
        rentalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rental",
            required: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        description: {
            type: String,
            required: true
        },

        estimatedCost: {
            type: Number,
            default: 0,
            min: 0
        },

        photos: [
            {
                type: String
            }
        ],

        status: {
            type: String,

            enum: [
                "OPEN",
                "UNDER_REVIEW",
                "RESOLVED",
                "REJECTED"
            ],

            default: "OPEN"
        },

        resolution: {
            type: String
        },

        resolvedAt: Date,

        deductedAmount: {
            type: Number,
            default: 0,
            min: 0
        },    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "DamageIncident",
    damageIncidentSchema
);