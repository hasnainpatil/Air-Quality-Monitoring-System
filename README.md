# 🌬️ Air Quality Monitoring & Predictive System

![Air Quality Dashboard Banner](<img width="1901" height="1001" alt="air quality tester" src="https://github.com/user-attachments/assets/ff2dc8a8-e831-48ec-8926-fbbf016f41bd" />
)

## 📌 Overview
This project is an advanced, full-stack IoT solution for real-time monitoring and predictive analysis of environmental air quality. It bridges the gap between hardware sensor data and user-friendly visualization, incorporating machine learning to provide early warnings for air quality deterioration.

The system uses **AWS IoT Core** for data transport, **FastAPI** for a robust backend, and **Next.js 14** for a high-performance, modern frontend.

---

## ✨ Key Features
*   **Real-time Monitoring**: Live sensor data streamed via WebSockets.
*   **AI Predictions**: 1-hour PM2.5 forecasting using a deep learning LSTM model.
*   **Interactive Analytics**: Dynamic charts and trends for PM2.5, Temperature, Humidity, and Gas levels.
*   **Smart Insights**: AI-generated health advice and ventilation recommendations.
*   **Secure Access**: JWT-based authentication for user sessions.
*   **Responsive Design**: A premium dark-mode interface built with Next.js and Glassmorphism.

---

## 🛠️ Tech Stack
| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Chart.js, Tailwind CSS |
| **Backend** | FastAPI (Python), SQLAlchemy, WebSockets |
| **Database** | SQLite (Production-ready with migrations) |
| **IoT / Transport** | AWS IoT Core, MQTT, Paho-MQTT |
| **Machine Learning** | TensorFlow/Keras (LSTM), Scikit-Learn |

---

## 🚀 Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+ & npm
*   AWS IoT Core credentials (certificates)

### 1. Backend Setup
```bash
# Navigate to root
# Install dependencies (ensure you have a virtual environment)
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. IoT Simulation (Optional)
To simulate live data publishing to AWS IoT:
```bash
python Air_Quality_Data_Simulation.py
```

---

## 📂 Project Structure
```text
├── backend/                # FastAPI server, Auth, and DB logic
├── frontend/               # Next.js 14 Dashboard
│   ├── app/                # App Router (Pages)
│   ├── components/         # UI Elements (Charts, Cards, etc.)
│   └── hooks/              # Custom Data Hooks
├── Air_Quality_Data_Simulation.py  # IoT Simulator & ML Inference
├── PM25_Model.h5           # Trained LSTM Model
├── scaler.pkl              # Feature Scaler
└── README.md               # This file!
```

---

## 🔒 Security Note
This project uses X.509 certificate-based authentication for AWS IoT. Ensure your `.pem`, `.crt`, and `.key` files are kept in the root directory but **never** committed to public version control (they are already included in `.gitignore`).

---

## 📝 License
This project is licensed under the MIT License.
