const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const equipmentRoutes = require("./routes/equipmentRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("RentAll Backend Server is Running!");
});

app.use("/api/equipment", equipmentRoutes);
app.use("/api/bookings", bookingRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Failed:");
        console.error(error);
    });