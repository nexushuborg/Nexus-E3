const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  verifyOtp,
  resendOtp
} = require("../controllers/authControllers");

router.use(express.json());

router.get("/", (req, res) => {
  res.send("User route is working");
});

// Auth routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);     // OTP verify
router.post("/resend-otp", resendOtp);     // OTP resend
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;