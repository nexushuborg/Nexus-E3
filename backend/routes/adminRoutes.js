const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllers');
const isLoggedIn = require('../middleware/isLoggedin');

// Basic middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied: Admins only." });
    }
};

// ─── PUBLIC (no auth needed) ──────────────────────────────────────────────────
// Drivers use this to verify their secret key before signup
router.post('/verify-driver-key', adminController.verifyDriverKey);

// ─── ADMIN SETTINGS ───────────────────────────────────────────────────────────
router.get('/settings', isLoggedIn, adminController.getSettings);
router.put('/settings', isLoggedIn, isAdmin, adminController.updateSettings);

// ─── DRIVER MANAGEMENT ────────────────────────────────────────────────────────
router.get('/drivers', isLoggedIn, isAdmin, adminController.getDrivers);
router.put('/drivers/assign', isLoggedIn, isAdmin, adminController.updateDriverAssignment);

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────
router.get('/users', isLoggedIn, isAdmin, adminController.getAllUsers);
router.put('/users/block', isLoggedIn, isAdmin, adminController.blockUser);
router.delete('/users/:userId', isLoggedIn, isAdmin, adminController.deleteUser);

// FIXED: Deleted Route Crashes Driver Map (BUG 4)
router.delete('/routes/:routeNo/kick', isLoggedIn, isAdmin, adminController.kickRoute);

module.exports = router;
