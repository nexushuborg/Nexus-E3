const userModel = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const generateOtp = require("../utils/generateOtp");
const sendOtpMail = require("../utils/sendOtpMail");

module.exports.register = async (req, res) => {
  try {
    const { fullname, regdNo, email, password } = req.body;

    if (!fullname || !regdNo || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp(); 
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const newUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
      regdNo,
      otp,
      otpExpires,
      isVerified: false
    });

    // 📧 Send OTP mail
    await sendOtpMail(email, otp);

    res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify to continue."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    // 🔐 Max attempts reached
    if (user.otpAttempts >= 5) {
      return res.status(403).json({
        error: "Maximum OTP attempts reached. Please resend OTP.",
      });
    }

    // ❌ OTP expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // ❌ OTP wrong
    if (user.otp !== String(otp)) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        error: `Invalid OTP. Attempts left: ${5 - user.otpAttempts}`,
      });
    }

    // ✅ OTP correct
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};


module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 2. Check OTP verification
    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify OTP first" });
    }

    // 3. Compare password (ONLY ONCE)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 4. Generate token
    const token = generateToken(user);

    // 5. Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
    });

    // 6. Success response
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};

module.exports.logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

module.exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    // 🔐 Generate new OTP
    const newOtp = generateOtp();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = newOtp;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    await user.save();

    // 📧 Send OTP again
    await sendOtpMail(email, newOtp);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to email",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
};
