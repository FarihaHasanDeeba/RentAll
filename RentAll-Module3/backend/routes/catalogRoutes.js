const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Item = require("../models/Item");

router.get("/users", async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    const users = await User.find(query).select("_id name email phone role location").sort({ name: 1 });
    res.json({ success: true, users });
  } catch (e) { res.status(500).json({ success: false, message: "Failed to load users." }); }
});

router.get("/items", async (req, res) => {
  try {
    const query = req.query.available === "false" ? {} : { isAvailable: true };
    if (req.query.category) query.category = req.query.category;
    const items = await Item.find(query).populate("ownerId", "name email phone role").sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (e) { res.status(500).json({ success: false, message: "Failed to load items." }); }
});

router.get("/items/:itemId", async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId).populate("ownerId", "name email phone role");
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, item });
  } catch (e) { res.status(400).json({ success: false, message: "Invalid item ID." }); }
});

module.exports = router;
