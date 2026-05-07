const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    // regdNo is UNIQUE — one registration number per student account
    regdNo: { type: String, unique: true, sparse: true }, // sparse: true allows multiple nulls (for drivers)
    role: { type: String, enum: ['student', 'driver', 'admin'], default: 'student' },
    year: { type: Number, default: 1 },
    
    // Driver-specific fields
    routeNo: { type: String },
    timing: { type: String },
    profileImage: { type: String },
    phone: { type: String },

    // Admin status flags
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);