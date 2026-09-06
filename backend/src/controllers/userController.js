const User = require("../models/user");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Server error while retrieving profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      dropOffLocation,
    } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update only the fields that were provided
    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    if (mobile !== undefined) {
      user.mobile = mobile;
    }

    if (dropOffLocation !== undefined) {
      user.dropOffLocation = dropOffLocation;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        accountType: updatedUser.accountType,
        dropOffLocation: updatedUser.dropOffLocation,
        identityVerified: updatedUser.identityVerified,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Server error while updating profile",
    });
  }
};
const updateVerificationStatus = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (!["pending", "verified", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({
        message: "Invalid verification status",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.verificationStatus = verificationStatus;
    user.identityVerified = verificationStatus === "verified";

    await user.save();

    res.status(200).json({
      message: "Identity verification status updated",
      identityVerified: user.identityVerified,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    console.error("Verification update error:", error);

    res.status(500).json({
      message: "Server error while updating verification status",
    });
  }
};


module.exports = {
  getProfile,
  updateProfile,
  updateVerificationStatus,
};
