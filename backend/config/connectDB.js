const mongoose = require("mongoose");

const connectDB = () => {
  console.log('Attempting to connect with URI:', process.env.MONGO_URI ? 'URI is set' : 'URI is undefined');
  
  return mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(error => {
      console.error("MongoDB connection failed:", error.message);
      console.error("Full error:", error);
      process.exit(1);
    });
};

module.exports = connectDB;