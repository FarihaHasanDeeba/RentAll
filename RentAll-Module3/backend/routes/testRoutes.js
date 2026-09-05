const express = require("express");

const User = require("../models/User");
const Item = require("../models/Item");

const router = express.Router();


// Create test renter and lender
router.post("/create-users", async (req, res) => {

    try {

        const renter = await User.create({
            name: "Test Renter",
            email: "renter@rentall.test",
            phone: "01700000000",
            password: "test123",
            role: "RENTER"
        });


        const lender = await User.create({
            name: "Test Lender",
            email: "lender@rentall.test",
            phone: "01800000000",
            password: "test123",
            role: "LENDER"
        });


        res.status(201).json({
            message: "Test users created successfully.",
            renter,
            lender
        });

    }

    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


// Create test item
router.post("/create-item", async (req, res) => {

    try {

        const lender = await User.findOne({
            role: "LENDER"
        });


        if (!lender) {

            return res.status(404).json({
                message: "Create a lender first."
            });

        }


        const item = await Item.create({

            ownerId: lender._id,

            title: "Bosch Professional Drill",

            description:
                "Professional electric drill available for short-term rental.",

            category: "Power Tools",

            rentalPricePerDay: 500,

            securityDeposit: 3000,

            images: [],

            location: {

                address: "Uttara, Dhaka",

                latitude: 23.8759,

                longitude: 90.3795

            },

            isAvailable: true

        });


        res.status(201).json({

            message: "Test item created successfully.",

            item

        });

    }

    catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});


module.exports = router;