const userModel = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const nodemailer = require("nodemailer");

// Cookie options — SameSite=None + Secure required for cross-origin (Vercel + Render)
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,          // HTTPS only in production
  sameSite: isProduction ? 'none' : 'lax',  // cross-origin in prod, relaxed in dev
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
module.exports.register = async (req, res) => {
  try {
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }
    
    let {fullname,regdNo, email, password } = req.body;
    
    // Check if required fields are present
    if (!fullname|| !regdNo|| !email || !password) {
      return res.status(400).json({ error: "Fullname, registration number, email, and password are required" });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    // Hash the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    let newUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
      regdNo
    });

    // Generate JWT token
    let token = generateToken(newUser);

    res.cookie("token", token, cookieOptions);
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        regdNo: newUser.regdNo
      },
      token: token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "An error occurred while registering the user" });
  }
};

module.exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // Comparing the password
    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        let token = generateToken(user);
        res.cookie("token", token, cookieOptions);
        res.status(200).json({ 
          message: "Login successful", 
          user: {
            _id: user._id,
            fullname: user.fullname,
            email: user.email
          }
        });
      } else {
        res.status(400).json({ error: "Invalid credentials" });
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
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

module.exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate random 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Delete any existing OTP for this email
    await otpModel.deleteMany({ email });

    // Save new OTP
    await otpModel.create({ email, otp: otpCode });

    // Send email using Nodemailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: `"Campus Commute" <${process.env.EMAIL}>`,
      to: email,
      subject: "Verification Code for Campus Commute",
      text: `Your verification code is: ${otpCode}. It will expire in 5 minutes.`,
      html: `<p>Your verification code is: <b>${otpCode}</b>.</p><p>It will expire in 5 minutes.</p>`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
};

module.exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

    // Find the latest OTP
    const record = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    if (record.otp === otp) {
      // Correct OTP, clear it
      await otpModel.deleteMany({ email });
      return res.status(200).json({ success: true, message: "OTP verified correctly" });
    } else {
      return res.status(400).json({ error: "Incorrect OTP" });
    }
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};
