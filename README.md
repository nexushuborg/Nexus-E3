# Nexus-E3: Campus Commute

**Campus Commute** is a comprehensive real-time bus tracking and transport management web application designed specifically for college campuses. It bridges the gap between drivers and students through a seamless, mobile-first platform, offering live telemetry, accurate ETAs, and smart arrival alarms.

## 🚀 Key Features
* **Real-Time GPS Tracking**: High-frequency bus location updates powered by WebSockets (Socket.io) and Leaflet maps.
* **Smart Arrival Alarms**: Users can select a destination stop and receive a notification *before* the bus arrives.
* **Dual Roles**: Dedicated onboarding, features, and distinct dashboards tailored specifically for **Students** and **Drivers**.
* **Modern Premium UI**: Clean, engaging, and card-based mobile-first layout leveraging TailwindCSS and Aceternity UI components.
* **Robust Auth**: Supports custom JWT-based email/password authentication alongside Google OAuth integration.

## 📁 Repository Structure
This repository operates as a monorepo consisting of two primary services:
* **[`/backend`](./backend)**: The Node.js API server responsible for data persistence (MongoDB), authentication, and Socket.io state management.
* **[`/Campus-commute`](./Campus-commute)**: The React.js (Vite) frontend application serving the client-side user interface.

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

### Environment Variables
Both directories contain `.env.example` files or require environment variable setup. See the respective READMEs in the subdirectories for detailed configuration instructions (e.g., MongoDB URI, Google Client ID).
