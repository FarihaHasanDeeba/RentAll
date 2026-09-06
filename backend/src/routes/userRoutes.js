const express = require("express");
const {
  getProfile,
  updateProfile,
  updateVerificationStatus,
} = require("../controllers/userController");


const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/verification", protect, updateVerificationStatus);

module.exports = router;