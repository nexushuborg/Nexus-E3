const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const connectDB = async () => {
  try {
    // Try remote Atlas first with a fast 3s timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("✅ MongoDB connected successfully to remote cluster.");
  } catch (error) {
    console.error("❌ Remote MongoDB connection failed:", error.message);
    
    // Auto-fallback to local in-memory MongoDB
    console.log("⚠️  Starting fallback Local Memory Database...");
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`✅ Connected to fallback Local Memory DB at ${mongoUri}`);
      console.log("   Note: Data will NOT persist when you restart the server.");
    } catch (memError) {
      console.error("❌ Fallback Memory DB also failed:", memError.message);
    }
  }
};

module.exports = connectDB;
