const mongoose = require("mongoose");

const connectDB = () => {
  return mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase")
    .then(() => console.log("MongoDB connected successfully"))
    .catch(error => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
};

module.exports = connectDB;
