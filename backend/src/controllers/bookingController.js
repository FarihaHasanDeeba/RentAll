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
        const booking = await Booking.create(req.body);

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