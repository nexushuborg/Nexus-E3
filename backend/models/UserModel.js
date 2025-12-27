const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    unique: true,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  regdNo: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },

  year: {
    type: Number,
    default: 1,
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  otpAttempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("User", userSchema);