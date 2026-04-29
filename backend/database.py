import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime

# Use absolute path based on the project root (parent of backend/)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DB_PATH = os.path.join(_PROJECT_ROOT, "airquality.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    sensor_data = relationship("SensorData", back_populates="owner")


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    pm2_5_indoor = Column(Float)
    pm2_5_outdoor = Column(Float, nullable=True)
    predicted_pm2_5_next_hour = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    gas_level = Column(Float)
    indoor_air_quality_category = Column(String)
    indoor_health_advice = Column(String)
    ventilation_advice = Column(String)

    owner = relationship("User", back_populates="sensor_data")


Base.metadata.create_all(bind=engine)
