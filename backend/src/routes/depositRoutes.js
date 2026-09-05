const express = require("express");

const {
  createDeposit,
  getDeposits,
  getDepositById,
  updateDepositStatus,
} = require("../controllers/depositController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createDeposit);

router.get("/", protect, getDeposits);

router.get("/:id", protect, getDepositById);

router.put("/:id/status", protect, updateDepositStatus);

module.exports = router;