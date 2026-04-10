const mongoose = require("mongoose");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retryCount = 0) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase", {
      serverSelectionTimeoutMS: 5000, // Fail fast after 5s instead of 30s
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }
    console.error("⚠️  All DB connection attempts failed. Server will continue without DB.");
    console.error("   API routes requiring DB operations will return errors.");
  }
};

module.exports = connectDB;
