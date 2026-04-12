# Campus Commute Backend

This directory houses the robust backend engine for the Campus Commute transport system. It is responsible for secure user authentication, maintaining the global state of active bus trips, and broadcasting high-frequency location data to active clients.

## 🛠️ Technology Stack
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB (utilizing `mongoose` ORM). Includes automatic fallback to `mongodb-memory-server` in development if the remote cluster rejects the connection.
* **Real-time Engine**: Socket.io
* **Authentication**: JWT (JSON Web Tokens), `bcrypt` for password hashing.
* **Email Services**: `nodemailer` for handling OTP verification dispatches.

## 🏗️ Architectural Overview
* `/config`: Database initialization strategies (`connectDB.js`), environment parsing, and Socket instantiation.
* `/controllers`: Business logic handlers mapping to Express routes (e.g., `authControllers.js`). 
* `/models`: Mongoose schemas defining structural data entities (`UserModel`, `otpModel`).
* `/routes`: API endpoint declarations.
* `/utils`: Cryptography and JWT generation helpers.

## 🔑 Environment Variables
Create an `.env` file in this directory with the following configurations:
```env
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:8081
MONGODB_URI=mongodb+srv://<user>:<pwd>@cluster.mongodb.net/?retryWrites=true
JWT_SECRET=your_highly_secure_secret_key
EMAIL=your_smtp_auth_email@gmail.com
EMAIL_PASS=your_app_specific_password
GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚀 Running Locally
1. `npm install`
2. `npm run dev` (Starts the server with `nodemon` for hot-reloading).
3. The API will normally spawn at `http://localhost:8000`.
