const express = require("express");
const router = express.Router();
const {register, login, logout, sendOTP, verifyOTP, googleLogin} = require('../controllers/authControllers');
// const cookieParser = require("cookie-parser");
router.use(express.json());

router.get("/", (req, res) => {
  res.send("User route is working");
});

// user routes
router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/logout", logout);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;