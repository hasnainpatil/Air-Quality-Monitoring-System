# Comprehensive Project Documentation: Air Quality Monitoring System

## 1. Executive Summary
This project is an advanced, full-stack IoT solution for real-time monitoring and predictive analysis of environmental air quality. It bridges the gap between hardware sensor data and user-friendly visualization, incorporating machine learning to provide early warnings for air quality deterioration.

---

## 2. System Architecture
The system is divided into four distinct layers:

### A. Data Generation & IoT Layer
*   **Source**: `Air_Quality_Data_Simulation.py`
*   **Transport**: MQTT (Message Queuing Telemetry Transport) over port 8883.
*   **Security**: TLS 1.2 with X.509 certificate-based mutual authentication.
*   **Cloud Broker**: AWS IoT Core.
*   **Topic**: `airquality/data`

### B. Ingestion & Logic Layer (Backend)
*   **Framework**: FastAPI (Python 3.10+)
*   **Concurrency**: Multi-threaded subscriber for MQTT; Asynchronous WebSocket for live broadcast.
*   **Database**: SQLite (SQLAlchemy ORM).
*   **Authentication**: JWT (JSON Web Tokens) for secure API access.

### C. Analytical Layer (Machine Learning)
*   **Model Type**: Deep Learning Sequential Model (saved as `PM25_Model.h5`).
*   **Scaler**: Standard Scaler (`scaler.pkl`) used for feature normalization.
*   **Input Features**: PM2.5 (Indoor/Outdoor), Temperature, Humidity.
*   **Output**: 1-hour PM2.5 Forecast.
*   **Inference**: Performed in real-time within the simulation script before publishing.

### D. Presentation Layer (Frontend)
*   **Framework**: Next.js 14 (React) with App Router.
*   **Data Handling**: Custom React Hook (`useSensorData`) managing WebSockets and REST polling.
*   **Visualization**: `Chart.js` for real-time time-series charts.
*   **UI/UX**: Responsive sidebar layout with Glassmorphism CSS styling.

---

## 3. Database Schema
### Table: `users`
*   `id`: Integer (Primary Key)
*   `username`: String (Unique, Indexed)
*   `hashed_password`: String

### Table: `sensor_data`
*   `id`: Integer (Primary Key)
*   `user_id`: Integer (Foreign Key -> `users.id`)
*   `pm2_5_indoor`: Float
*   `pm2_5_outdoor`: Float
*   `predicted_pm2_5_next_hour`: Float
*   `temperature`: Float
*   `humidity`: Float
*   `gas_level`: Float
*   `indoor_air_quality_category`: String
*   `indoor_health_advice`: Text
*   `ventilation_advice`: Text
*   `timestamp`: DateTime (Default: Now)

---

## 4. API Endpoints
### Authentication
*   `POST /api/signup`: Creates a new user and returns a JWT.
*   `POST /api/signin`: Validates credentials and returns a JWT. Starts the simulation.
*   `POST /api/logout`: Clears the session and stops the simulation.

### Data
*   `GET /api/me`: Returns current user info. Restores session/simulation on refresh.
*   `GET /api/data`: Returns historical data.
    *   **Params**: `limit` (int), `skip` (int), `sort` (asc/desc).
*   `GET /api/health`: Returns system status (MQTT active, simulation running).

### Real-Time
*   `WS /ws`: WebSocket endpoint for real-time JSON sensor updates.

---

## 5. Detailed Component Breakdown
### Frontend Pages
1.  **Overview**: High-level summary dashboard with current metric cards and a primary PM2.5 trend chart.
2.  **Trends**: Multi-chart view for deep analysis of both air quality and environmental variables.
3.  **Insights**: AI recommendation engine that compares current data to forecasts and generates proactive health/ventilation warnings.
4.  **History**: Paginated data grid for auditing and CSV-style review.

---

## 6. Project Directory Structure
```text
/Air Quality
├── backend/
│   ├── main.py          # FastAPI server and MQTT logic
│   ├── auth.py          # JWT and Password hashing
│   ├── database.py      # SQLAlchemy models and DB config
│   └── air_quality.db   # SQLite Database file
├── frontend/
│   ├── app/
│   │   ├── page.js      # Main entry point / Routing
│   │   └── globals.css  # Global Design System
│   ├── components/      # UI Components (Overview, Trends, etc.)
│   └── hooks/           # Custom React Hooks (useSensorData)
├── Air_Quality_Data_Simulation.py  # IoT Data Simulator / ML Inference
├── PM25_Model.h5        # Trained ML Model
├── scaler.pkl           # Feature Scaler
└── instructions.txt     # Quick-start guide
```

---

## 7. Future Considerations
*   **Environment Variables**: Move `SECRET_KEY` and AWS Endpoint to a `.env` file.
*   **Dockerization**: Containerize the backend and frontend for easier cloud deployment.
*   **Advanced Analytics**: Integrate a more complex ML model (e.g., Transformer-based) for multi-hour forecasting.

---
**Document Status**: Final Version 1.0
**Author**: Project Builder AI Assistant
**Date**: April 29, 2026
