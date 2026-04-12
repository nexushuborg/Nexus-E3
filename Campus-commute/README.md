# Campus Commute Frontend

This directory contains the user interface for the Campus Commute application. It is constructed using **React**, **TypeScript**, and **Vite**, focusing heavily on providing a premium, mobile-native experience directly within the web browser.

## 🛠️ Technology Stack
* **Framework**: React 18 with Vite
* **Language**: TypeScript
* **Styling**: TailwindCSS
* **Mapping**: Leaflet (`react-leaflet`) for rendering open-source maps.
* **State Management**: React Context APIs (`AuthContext`, `RouteContext`)
* **Icons**: `lucide-react`
* **Form Validation**: `zod`

## 🏗️ Folder Architecture
* `/src/assets`: Static imagery, mock JSON data, and global CSS.
* `/src/components`: Highly reusable UI widgets (`AuthCard`, `GradientButton`, `MobileLayout`).
* `/src/contexts`: Application state providers orchestrating global data.
* `/src/pages`: Distinct route views tailored for Student and Driver flows (e.g., `RunningStatus`, `DriverInfo`).
* `/src/utils`: Helper functions and distance calculation algorithms.

## 🔑 Environment Variables
Create a `.env` file in this directory with the following variables:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_BACKEND_URL=http://localhost:8000
```

## 🚀 Running Locally
1. `npm install`
2. `npm run dev`
3. Access the web app at `http://localhost:8080` (or the port specified by Vite).
