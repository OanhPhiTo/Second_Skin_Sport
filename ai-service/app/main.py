from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze

app = FastAPI(
    title="Second Skin Sport - AI Analysis Service",
    description="Service for analyzing motion sensor data and predicting activities.",
    version="1.0.0"
)

# Allow CORS for backend service integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Analysis Service"}

@app.get("/")
def root():
    return {"message": "Welcome to Second Skin Sport AI Service. See /docs for API documentation."}
