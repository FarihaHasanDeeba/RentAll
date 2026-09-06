const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User= require("../models/user");

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      accountType,
      bankDetails,
      password,
    } = req.body;

    // 1. Check required fields
    if (
      !fullName ||
      !email ||
      !mobile ||
      !accountType ||
      !bankDetails ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2. Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user
    const user = await User.create({
      fullName,
      email,
      mobile,
      accountType,
      bankDetails,
      password: hashedPassword,
    });

    // 5. Send response
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        accountType: user.accountType,
        identityVerified: user.identityVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Server error during registration",
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        accountType: user.accountType,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        identityVerified: user.identityVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};