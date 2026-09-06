const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
    {
        renterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        lenderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        rentalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        securityDeposit: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,

            enum: [
                "REQUESTED",
                "ACCEPTED",
                "REJECTED",
                "CHECKED_OUT",
                "IN_USE",
                "RETURNED",
                "DAMAGE_REPORTED",
                "CHECKED_APPROVED",
                "CLOSED"
            ],

            default: "REQUESTED"
        },

        pickupLocation: {
            address: String,
            latitude: Number,
            longitude: Number
        },

        pickupRadiusKm: {
            type: Number,
            default: 1.2
        },

        handoverSpot: {
            name: String,
            address: String,
            latitude: Number,
            longitude: Number,
            placeId: String,
            mapsUrl: String,
            source: String,
            proposedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            confirmedByRenter: {
                type: Boolean,
                default: false
            },
            confirmedByLender: {
                type: Boolean,
                default: false
            }
        },

        handover: {
            purpose: {
                type: String,
                enum: ["CHECKOUT", "RETURN", null],
                default: null
            },
            otpHash: String,
            otpExpiresAt: Date,
            verified: {
                type: Boolean,
                default: false
            },
            verifiedAt: Date,
            itemMatchesDescription: {
                type: Boolean,
                default: false
            },
            attempts: {
                type: Number,
                default: 0
            }
        },

        statusHistory: [
            {
                status: String,
                at: {
                    type: Date,
                    default: Date.now
                },
                note: String,
                actorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            }
        ],

        escrowFrozenAt: Date,
        escrowFrozenReason: String,

        returnedAt: Date,

        depositStatus: {
            type: String,

            enum: [
                "PENDING",
                "HELD",
                "RELEASED",
                "FROZEN",
                "DEDUCTED"
            ],

            default: "PENDING"
        },

        deductedAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        paymentStatus: {
            type: String,

            enum: [
                "PENDING",
                "PAID",
                "FAILED",
                "REFUNDED"
            ],

            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

rentalSchema.index({ itemId: 1, status: 1, startDate: 1, endDate: 1 });
rentalSchema.index({ renterId: 1, createdAt: -1 });
rentalSchema.index({ lenderId: 1, createdAt: -1 });

module.exports = mongoose.model("Rental", rentalSchema);