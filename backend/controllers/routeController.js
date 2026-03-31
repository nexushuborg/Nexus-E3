const ROUTES = require("../data/routes.json");

exports.getAllRoutes = (req, res) => {
  res.json(ROUTES);
};

exports.getRouteByBus = (req, res) => {
  const { busId } = req.params;

  const route = ROUTES.find(
    r => r.busNumber === busId
  );

  if (!route) {
    return res.status(404).json({ message: "Bus route not found" });
  }

  res.json(route);
};
