import asyncio
import json
import os
import sys
import subprocess
import time
import threading
from datetime import timedelta, datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import database, auth
from .database import engine

from fastapi.responses import JSONResponse
from fastapi.requests import Request
import traceback

# =========================================================
# Project root — parent of backend/
# =========================================================
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_details = traceback.format_exc()
    print("GLOBAL EXCEPTION CAUGHT:\n", error_details)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to track state
ACTIVE_USER_ID = None
SIMULATION_PROCESS = None

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ---------------------------------------------------------
# WebSocket Manager
# ---------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        # Clean up dead connections
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()

# We need a reference to the running event loop so the MQTT thread
# can schedule coroutines safely (asyncio.run() crashes from a thread).
_event_loop: asyncio.AbstractEventLoop = None


# ---------------------------------------------------------
# MQTT Integration  (AWS IoT Core)
# ---------------------------------------------------------
def start_mqtt_thread():
    """
    Subscribe to the AWS IoT MQTT topic in a background thread.
    When a message arrives it is:
      1. Broadcast to every connected WebSocket client.
      2. Saved to the SQLite database (if a user is logged in).
    """
    from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

    ENDPOINT = "<YOUR AWS IOT DOMAIN NAME"
    TOPIC = "airquality/data"
    CLIENT_ID = "fastapi-subscriber-" + str(int(time.time()))

    # Resolve certificate paths relative to the project root
    path_to_cert = os.path.join(
        PROJECT_ROOT,
        "<ROOT PATH>",
    )
    path_to_key = os.path.join(
        PROJECT_ROOT,
        "<ROOT PATH>",
    )
    path_to_root = os.path.join(PROJECT_ROOT, "<AWS ROOT PATH>")

    def on_message(client, userdata, msg):
        """Called by the AWS IoT SDK on the MQTT thread — NOT the asyncio loop."""
        global ACTIVE_USER_ID
        try:
            payload = msg.payload.decode("utf-8")
            data = json.loads(payload)
            print(
                f"[MQTT] Received data for User {ACTIVE_USER_ID}: "
                f"PM2.5 = {data.get('pm2_5_indoor')}"
            )

            # --- Broadcast to WebSocket clients (thread-safe) ---
            if _event_loop is not None and not _event_loop.is_closed():
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast(payload), _event_loop
                )

            # --- Save to database if a user is logged in ---
            if ACTIVE_USER_ID is not None:
                db = database.SessionLocal()
                try:
                    sensor_data = database.SensorData(
                        user_id=ACTIVE_USER_ID,
                        pm2_5_indoor=data.get("pm2_5_indoor"),
                        pm2_5_outdoor=data.get("pm2_5_outdoor"),
                        predicted_pm2_5_next_hour=data.get("predicted_pm2_5_next_hour"),
                        temperature=data.get("temperature"),
                        humidity=data.get("humidity"),
                        gas_level=data.get("gas_level"),
                        indoor_air_quality_category=data.get("indoor_air_quality_category"),
                        indoor_health_advice=data.get("indoor_health_advice"),
                        ventilation_advice=data.get("ventilation_advice"),
                    )
                    db.add(sensor_data)
                    db.commit()
                    print(f"[DB] Saved sensor data for user {ACTIVE_USER_ID}")
                except Exception as e:
                    print(f"[DB] Error: {e}")
                    db.rollback()
                finally:
                    db.close()

        except Exception as e:
            print(f"[MQTT] Message processing error: {e}")

    try:
        client = AWSIoTMQTTClient(CLIENT_ID)
        client.configureEndpoint(ENDPOINT, 8883)
        client.configureCredentials(path_to_root, path_to_key, path_to_cert)
        client.configureOfflinePublishQueueing(-1)
        client.configureDrainingFrequency(2)
        client.configureConnectDisconnectTimeout(10)
        client.configureMQTTOperationTimeout(5)

        client.connect()
        print("[MQTT] OK - Backend connected to AWS IoT Core")
        client.subscribe(TOPIC, 1, on_message)
        print(f"[MQTT] OK - Subscribed to topic: {TOPIC}")

        # Keep the thread alive
        while True:
            time.sleep(1)
    except Exception as e:
        print(f"[MQTT] FAIL - Failed to start MQTT subscriber: {e}")
        print("[MQTT]   The backend will still work -- data can be polled from the DB.")


# ---------------------------------------------------------
# Simulation Process Manager
# ---------------------------------------------------------
def start_simulation():
    """Launch the Air_Quality_Data_Simulation.py script as a subprocess."""
    global SIMULATION_PROCESS
    if SIMULATION_PROCESS is not None and SIMULATION_PROCESS.poll() is None:
        print("[SIM] Simulation already running.")
        return

    script_path = os.path.join(PROJECT_ROOT, "Air_Quality_Data_Simulation.py")
    if not os.path.exists(script_path):
        print(f"[SIM] FAIL - Simulation script not found at: {script_path}")
        return

    print(f"[SIM] Starting simulation using {sys.executable}...")
    SIMULATION_PROCESS = subprocess.Popen(
        [sys.executable, script_path],
        cwd=PROJECT_ROOT,  # Ensures relative cert/model paths resolve correctly
    )
    print(f"[SIM] OK - Simulation started (PID: {SIMULATION_PROCESS.pid})")


def stop_simulation():
    global SIMULATION_PROCESS
    if SIMULATION_PROCESS is not None and SIMULATION_PROCESS.poll() is None:
        print("[SIM] Stopping simulation...")
        SIMULATION_PROCESS.terminate()
        SIMULATION_PROCESS = None
        print("[SIM] OK - Simulation stopped.")


# ---------------------------------------------------------
# Startup / Shutdown Events
# ---------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    """Capture the running event loop and start the MQTT subscriber thread."""
    global _event_loop
    _event_loop = asyncio.get_running_loop()

    mqtt_thread = threading.Thread(target=start_mqtt_thread, daemon=True)
    mqtt_thread.start()
    print("[APP] OK - MQTT subscriber thread launched.")


@app.on_event("shutdown")
async def on_shutdown():
    stop_simulation()
    print("[APP] OK - Shutdown complete.")


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "mqtt_active": True,
        "active_user": ACTIVE_USER_ID,
        "simulation_running": (
            SIMULATION_PROCESS is not None
            and SIMULATION_PROCESS.poll() is None
        ),
    }


@app.post("/api/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(auth.get_db)):
    db_user = db.query(database.User).filter(
        database.User.username == user.username
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = auth.get_password_hash(user.password)
    new_user = database.User(
        username=user.username, hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={"sub": new_user.username})

    global ACTIVE_USER_ID
    ACTIVE_USER_ID = new_user.id
    start_simulation()

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/signin", response_model=Token)
def login(user: UserCreate, db: Session = Depends(auth.get_db)):
    db_user = db.query(database.User).filter(
        database.User.username == user.username
    ).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    global ACTIVE_USER_ID
    ACTIVE_USER_ID = db_user.id

    # Automatically start simulation on login
    start_simulation()

    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/logout")
def logout():
    global ACTIVE_USER_ID
    ACTIVE_USER_ID = None
    stop_simulation()
    return {"msg": "Logged out successfully"}


@app.get("/api/me")
def get_me(current_user: database.User = Depends(auth.get_current_user)):
    global ACTIVE_USER_ID
    if ACTIVE_USER_ID != current_user.id:
        ACTIVE_USER_ID = current_user.id
        start_simulation()
    return {"username": current_user.username}


@app.get("/api/data")
def get_user_data(
    limit: int = 100,
    skip: int = 0,
    sort: str = "asc",
    current_user: database.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db),
):
    data = (
        db.query(database.SensorData)
        .filter(database.SensorData.user_id == current_user.id)
        .order_by(database.SensorData.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    if sort == "asc":
        # Reverse to return chronological order for charts
        return data[::-1]
    return data


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"[WS] Client connected. Total: {len(manager.active_connections)}")
    try:
        while True:
            # Keep connection alive — client can send pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"[WS] Client disconnected. Total: {len(manager.active_connections)}")
    except Exception:
        manager.disconnect(websocket)
