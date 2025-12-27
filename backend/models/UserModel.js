const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    regdNo: String,
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    year: { type: Number, default: 1 }
});

module.exports = mongoose.model("User", userSchema);