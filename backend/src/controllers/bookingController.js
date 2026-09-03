const Booking = require("../models/Booking");

// Get all bookings
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("equipment");

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
};


// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("equipment");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch booking",
            error: error.message
        });
    }
};


// Create booking
const createBooking = async (req, res) => {
    try {
        const {
            equipment,
            userName,
            startDate,
            endDate,
            totalPrice
        } = req.body;

        // Check required fields
        if (
            !equipment ||
            !userName ||
            !startDate ||
            !endDate ||
            totalPrice === undefined
        ) {
            return res.status(400).json({
                message: "All booking fields are required."
            });
        }

        // Check date validity
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                message: "End date must be after start date."
            });
        }

        // Check if equipment is already booked
        const overlappingBooking = await Booking.findOne({
            equipment: equipment,

            status: {
                $in: ["pending", "confirmed"]
            },

            startDate: {
                $lt: new Date(endDate)
            },

            endDate: {
                $gt: new Date(startDate)
            }
        });

        if (overlappingBooking) {
            return res.status(409).json({
                message:
                    "This equipment is already booked for the selected dates."
            });
        }

        // Create booking
        const booking = await Booking.create({
            equipment,
            userName,
            startDate,
            endDate,
            totalPrice
        });

        res.status(201).json(booking);

    } catch (error) {
        res.status(400).json({
            message: "Failed to create booking",
            error: error.message
        });
    }
};


module.exports = {
    getAllBookings,
    getBookingById,
    createBooking
};