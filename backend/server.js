const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const port = process.env.BACKEND_PORT;
const connectDB = require('./config/connectDB');

//importing routes
const userRouter = require('./routes/userRouter');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


// Connect to database with error handling
connectDB().catch(err => {
  console.error("Failed to connect to database:", err.message);
  // Continue running the server even if DB connection fails
});



// basic route for health check
app.get('/', (req, res) => {
  res.send('server is running....');
});

app.use('/user', userRouter);


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});