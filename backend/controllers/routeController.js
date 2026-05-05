// FIXED: routes.json -> MongoDB Migration (BUG 3)
const Route = require("../models/RouteModel");
const fs = require("fs");
const path = require("path");

exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    if (routes && routes.length > 0) {
      return res.json(routes);
    }
    // Fallback if empty
    const fallbackData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/routes.json'), 'utf8'));
    return res.json(fallbackData);
  } catch (error) {
    console.error("DB failed, using fallback routes.json");
    try {
      const fallbackData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/routes.json'), 'utf8'));
      return res.json(fallbackData);
    } catch(err) {
      res.status(500).json({ success: false, message: "Failed to fetch routes", error: error.message });
    }
  }
};

exports.getRouteByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const route = await Route.findOne({ busNumber: busId });
    if (!route) {
      return res.status(404).json({ message: "Bus route not found" });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch route", error: error.message });
  }
};

// Admin CRUD Endpoints
exports.createRoute = async (req, res) => {
  try {
    const routeData = req.body;
    
    // Check for duplicate routeName
    const existing = await Route.findOne({ routeName: routeData.routeName });
    if (existing) {
      return res.status(400).json({ success: false, message: "A route with this name already exists." });
    }

    const newRoute = new Route(routeData);
    await newRoute.save();
    res.status(201).json({ success: true, route: newRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create route", error: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for duplicate routeName if it's being changed
    if (updateData.routeName) {
        const existing = await Route.findOne({ routeName: updateData.routeName, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: "A route with this name already exists." });
        }
    }

    const updatedRoute = await Route.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    res.status(200).json({ success: true, route: updatedRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update route", error: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRoute = await Route.findByIdAndDelete(id);
    if (!deletedRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    res.status(200).json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete route", error: error.message });
  }
};
