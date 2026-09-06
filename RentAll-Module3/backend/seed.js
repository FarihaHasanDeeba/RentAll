const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Item = require("./models/Item");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  await mongoose.connect(process.env.MONGODB_URI);
  const password = await bcrypt.hash("RentAll@123", 12);

  const renter = await User.findOneAndUpdate(
    { email: "renter@rentall.demo" },
    { $set: { name: "Demo Renter", phone: process.env.DEMO_PHONE || "+8801700000000", password, role: "RENTER", location: { address: "Uttara, Dhaka, Bangladesh", latitude: 23.8759, longitude: 90.3795 } } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const lender = await User.findOneAndUpdate(
    { email: "lender@rentall.demo" },
    { $set: { name: "Demo Lender", phone: process.env.DEMO_PHONE || "+8801700000001", password, role: "LENDER", location: { address: "Uttara, Dhaka, Bangladesh", latitude: 23.8759, longitude: 90.3795 } } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const item = await Item.findOneAndUpdate(
    { title: "Demo Cordless Drill", ownerId: lender._id },
    { $set: { title: "Demo Cordless Drill", description: "18V cordless drill with battery and charger.", category: "Tools", rentalPricePerDay: 500, securityDeposit: 3000, images: [], location: { address: "Uttara, Dhaka, Bangladesh", latitude: 23.8759, longitude: 90.3795 }, isAvailable: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("\n=== RentAll demo data ===");
  console.log("Renter ID:", renter._id.toString());
  console.log("Lender ID:", lender._id.toString());
  console.log("Item ID:  ", item._id.toString());
  console.log("Demo password for both users: RentAll@123");
  console.log("==========================\n");
  await mongoose.disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
