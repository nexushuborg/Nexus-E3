# 🚌 Nexus-E3: Campus Commute

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black)

**Campus Commute** is a comprehensive, real-time bus tracking and transport management web application designed specifically for college campuses. It bridges the gap between drivers and students through a seamless, mobile-first platform, offering live telemetry, accurate ETAs, smart arrival alarms, and a built-in GPS simulation mode for easy testing.

---

## ✨ Key Features

* **📍 Real-Time GPS Tracking**: High-frequency bus location updates powered by WebSockets (Socket.io) and Leaflet maps.
* **🎮 GPS Simulation Mode**: Drivers can instantly simulate their route directly from the dashboard, broadcasting a moving location to all students without physically driving. Perfect for demonstrations!
* **⏰ Enhanced Arrival Alarms**: Stop missing the bus! Users can set a target stop and receive a **full-screen visual overlay, device vibration, and audio alarm** when the bus is approaching.
* **👥 Dual Roles**: Dedicated onboarding flows and distinct dashboards tailored specifically for **Students** and **Drivers**.
* **💎 Premium UI/UX**: Clean, engaging, and card-based mobile-first layout leveraging TailwindCSS, Shadcn UI, and Lucide Icons.
* **🔐 Robust Auth**: Supports custom JWT-based email/password authentication (with OTP verification) alongside Google OAuth integration.

---

## 🛠️ Technology Stack

**Frontend:**
- React.js (Vite)
- TypeScript
- Tailwind CSS & Shadcn UI
- React Leaflet & Leaflet Routing Machine
- Socket.io-client

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- Socket.io (Real-time telemetry)
- JWT & bcrypt (Authentication)
- Nodemailer (OTP Delivery)

---

## 🧪 Test Credentials

Want to jump right in and test the app? Use the pre-configured test accounts below:

### 🎒 Student Account
* **Email:** `student@test.edu`
* **Password:** `Password123!`
* **Capabilities:** Can view live tracking, set alarms, and see ETAs.

### 🚌 Driver Account
* **Email:** `driver@test.edu`
* **Password:** `Password123!`
* **Capabilities:** Can start trips, broadcast real GPS locations, and use the **GPS Simulation Mode**.

> **💡 Pro Tip:** Open two browser windows—log in as the Driver in one and start the "Simulate Route" feature. Log in as the Student in the other window to watch the bus move live on the map!

---

## 📁 Repository Structure

This repository operates as a monorepo consisting of two primary services:
* **[`/backend`](./backend)**: The Node.js API server responsible for data persistence, authentication, and WebSocket state management.
* **[`/Campus-commute`](./Campus-commute)**: The React.js frontend application serving the client-side user interface.

---

## ⚡ Quick Start

### 1. Start the Backend Server
Navigate to the backend directory, install dependencies, and run the development server.
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend Application
In a separate terminal, navigate to the frontend directory, install dependencies, and run the Vite server.
```bash
cd Campus-commute
npm install
npm run dev
```

### 3. Environment Variables
Both directories contain `.env.example` files or require environment variable setup. See the respective READMEs in the subdirectories for detailed configuration instructions (e.g., MongoDB URI, Google Client ID, JWT Secret).
