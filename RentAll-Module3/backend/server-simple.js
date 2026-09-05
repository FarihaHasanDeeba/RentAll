const express = require("express");
const cors = require("cors");
require("dotenv").config();

const rentalRoutes = require("./routes/rentalRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/rentals", rentalRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "RentAll Module 3 Backend is running!",
        note: "This is a simplified version for API testing without database connectivity",
        endpoints: {
            rentals: {
                "POST /api/rentals": "Submit rent request",
                "PUT /api/rentals/:rentalId/status": "Update rental status",
                "GET /api/rentals/:rentalId/status-history": "Get status history",
                "PUT /api/rentals/:rentalId/pickup-location": "Set pickup location",
                "POST /api/rentals/:rentalId/handover-spot": "Propose handover spot",
                "PUT /api/rentals/:rentalId/handover-spot/confirm": "Confirm handover spot",
                "POST /api/rentals/:rentalId/handover-otp": "Generate OTP",
                "POST /api/rentals/:rentalId/handover-verify": "Verify OTP",
                "POST /api/rentals/:rentalId/damage": "Report damage",
                "GET /api/rentals/:rentalId/damage": "Get damage incidents",
                "PUT /api/rentals/damage/:incidentId": "Update damage incident",
                "GET /api/rentals/:rentalId": "Get rental details",
                "GET /api/rentals/user/:userId": "Get user rentals"
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`RentAll backend running on port ${PORT}`);
    console.log("Note: Database operations will fail without MongoDB connection");
    console.log("Use test-dashboard.html to test API endpoints structure");
});