const AdminSettings = require('../models/adminSettingsModel');
const User = require('../models/UserModel');

// ─── SETTINGS ────────────────────────────────────────────────────────────────

exports.getSettings = async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();
        if (!settings) settings = await AdminSettings.create({});
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { adminName, adminPhone, dutyInstructions, driverSecretKey } = req.body;
        let settings = await AdminSettings.findOne();
        if (!settings) settings = new AdminSettings();
        if (adminName !== undefined) settings.adminName = adminName;
        if (adminPhone !== undefined) settings.adminPhone = adminPhone;
        if (dutyInstructions !== undefined) settings.dutyInstructions = dutyInstructions;
        if (driverSecretKey !== undefined) settings.driverSecretKey = driverSecretKey;
        await settings.save();
        res.status(200).json({ success: true, settings, message: "Settings updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── DRIVER MANAGEMENT ───────────────────────────────────────────────────────

exports.getDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' }).select('-password');
        res.status(200).json({ success: true, drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateDriverAssignment = async (req, res) => {
    try {
        const { driverId, routeNo, timing } = req.body;
        const driver = await User.findById(driverId);
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
        if (routeNo !== undefined) driver.routeNo = routeNo;
        if (timing !== undefined) driver.timing = timing;
        await driver.save();
        res.status(200).json({ success: true, driver, message: "Driver updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const { userId, block } = req.body;
        
        // FIXED: Admin Can Block Themselves (BUG 3)
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot block yourself." });
        }

        const user = await User.findByIdAndUpdate(userId, { isBlocked: block }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.status(200).json({ success: true, user, message: `User ${block ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── VERIFY DRIVER SECRET KEY (public — no auth needed) ──────────────────────
exports.verifyDriverKey = async (req, res) => {
    try {
        const { key } = req.body;
        const settings = await AdminSettings.findOne();
        if (!settings) return res.status(400).json({ valid: false });
        const isValid = settings.driverSecretKey === key;
        res.status(200).json({ valid: isValid });
    } catch (error) {
        res.status(500).json({ valid: false, message: "Server error" });
    }
};

// FIXED: Deleted Route Crashes Driver Map (BUG 4)
exports.kickRoute = async (req, res) => {
    try {
        const { routeNo } = req.params;
        // Access global io instance from app
        const io = req.app.get('io');
        if (io) {
            io.to(routeNo).emit("route-deleted");
        }
        res.status(200).json({ success: true, message: "Route kick event sent." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
