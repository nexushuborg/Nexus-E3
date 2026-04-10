const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    regdNo: String, // Nullable for drivers
    role: { type: String, enum: ['student', 'driver', 'admin'], default: 'student' },
    year: { type: Number, default: 1 },
    
    // Driver-specific fields
    routeNo: { type: String },
    timing: { type: String },
    profileImage: { type: String },
    phone: { type: String }
});

module.exports = mongoose.model("User", userSchema);