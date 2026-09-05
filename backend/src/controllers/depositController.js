const Deposit = require("../models/deposit");

// Create a new deposit
const createDeposit = async (req, res) => {
  try {
    const { rentalId, amount, paymentId } = req.body;

    if (!rentalId || amount === undefined) {
      return res.status(400).json({
        message: "Rental ID and amount are required",
      });
    }

    const deposit = await Deposit.create({
      user: req.user.userId,
      rentalId,
      amount,
      paymentId: paymentId || "",
      status: "PENDING",
    });

    res.status(201).json({
      message: "Deposit created successfully",
      deposit,
    });
  } catch (error) {
    console.error("Create deposit error:", error);

    res.status(500).json({
      message: "Server error while creating deposit",
    });
  }
};


// Get all deposits of logged-in user
const getDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      deposits,
    });
  } catch (error) {
    console.error("Get deposits error:", error);

    res.status(500).json({
      message: "Server error while retrieving deposits",
    });
  }
};


// Get one deposit
const getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!deposit) {
      return res.status(404).json({
        message: "Deposit not found",
      });
    }

    res.status(200).json({
      deposit,
    });
  } catch (error) {
    console.error("Get deposit error:", error);

    res.status(500).json({
      message: "Server error while retrieving deposit",
    });
  }
};


// Update deposit status
const updateDepositStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "HELD",
      "RELEASED",
      "REFUNDED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid deposit status",
      });
    }

    const deposit = await Deposit.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!deposit) {
      return res.status(404).json({
        message: "Deposit not found",
      });
    }

    deposit.status = status;

    if (status === "RELEASED" || status === "REFUNDED") {
      deposit.releasedAt = new Date();
    }

    await deposit.save();

    res.status(200).json({
      message: "Deposit status updated successfully",
      deposit,
    });
  } catch (error) {
    console.error("Update deposit status error:", error);

    res.status(500).json({
      message: "Server error while updating deposit",
    });
  }
};


module.exports = {
  createDeposit,
  getDeposits,
  getDepositById,
  updateDepositStatus,
};