const userModel = require("../models/UserModel");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otpModel");
const nodemailer = require("nodemailer");
module.exports.register = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }
    
    let { fullname, regdNo, email, password, role, routeNo, timing, phone, profileImage } = req.body;
    
    // Check required base fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: "Fullname, email, and password are required" });
    }

    // Role specific validation
    const assignedRole = role || 'student';
    if (assignedRole === 'student' && !regdNo) {
      return res.status(400).json({ error: "Registration number is required for students" });
    }
    if (assignedRole === 'driver' && (!routeNo || !timing)) {
      return res.status(400).json({ error: "Route number and timing are required for drivers" });
    }
    
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    let newUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
      regdNo,
      role: assignedRole,
      routeNo,
      timing,
      phone,
      profileImage
    });

    let token = generateToken(newUser);
        
    res.cookie("token", token);
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        routeNo: newUser.routeNo
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
        res.cookie("token", token);
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

module.exports.googleLogin = async (req, res) => {
  try {
    const { accessToken, role } = req.body;
    if (!accessToken) return res.status(400).json({ error: "Access token is required" });

    // Fetch user details from Google
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
    });
    
    if (!response.ok) {
        return res.status(401).json({ error: "Invalid Google token" });
    }
    
    const googleUser = await response.json();
    const assignedRole = role || 'student';
    
    let user = await userModel.findOne({ email: googleUser.email });
    
    if (!user) {
      // Auto-register via Google
      user = await userModel.create({
        fullname: googleUser.name,
        email: googleUser.email,
        password: "OAuthGeneratedPassword!123", // Dummy password for OAuth users
        profileImage: googleUser.picture,
        role: assignedRole,
        routeNo: assignedRole === 'driver' ? 'CUTTACK-1-A' : undefined
      });
    }

    let token = generateToken(user);
    res.cookie("token", token);
    
    res.status(200).json({
      success: true,
      message: "Google OAuth successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        routeNo: user.routeNo,
        profileImage: user.profileImage
      },
      token: token
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};
