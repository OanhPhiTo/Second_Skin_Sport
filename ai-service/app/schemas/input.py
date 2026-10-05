from pydantic import BaseModel
from typing import List

class SensorSample(BaseModel):
    timestamp: int
    ax: float
    ay: float
    az: float
    gx: float
    gy: float
    gz: float
    lat: float = 0.0
    lng: float = 0.0
    speed: float = 0.0

class SensorWindow(BaseModel):
    sessionId: str
    deviceId: str
    samples: List[SensorSample]
