const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const rentalRoutes = require("./routes/rentalRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const mapsRoutes = require("./routes/mapsRoutes");

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/rentals", rentalRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/maps", mapsRoutes);

app.get("/", (req, res) => res.json({
  success: true,
  message: "RentAll Module 3 Backend is running!",
  version: "1.0.0",
  features: [11, 12, 13, 14, 15]
}));
app.get("/api/health", (req, res) => res.json({
  success: true,
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  time: new Date().toISOString()
}));

app.use((req, res) => res.status(404).json({ success: false, message: "API endpoint not found." }));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Put your MongoDB Atlas connection string in backend/.env.");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10
  });
  console.log("MongoDB Atlas connected successfully!");
}

const PORT = Number(process.env.PORT || 5000);
connectDatabase()
  .then(() => app.listen(PORT, () => console.log(`RentAll backend running on port ${PORT}`)))
  .catch((error) => {
    console.error("Database startup failed:");
    console.error(error.message);
    process.exit(1);
  });

module.exports = app;
