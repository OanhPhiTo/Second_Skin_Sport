from pydantic import BaseModel
from typing import List

class Metrics(BaseModel):
    stepCount: int
    cadence: int
    speed: float
    distance: float
    intensity: str
    consistency: float

class PostureAnalysis(BaseModel):
    score: int
    deviations: List[str]
    recommendations: List[str]

class AnalysisResult(BaseModel):
    activity: str
    confidence: float
    metrics: Metrics
    posture: PostureAnalysis
