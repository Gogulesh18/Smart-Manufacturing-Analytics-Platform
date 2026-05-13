from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
DATA_CSV = ROOT / "data" / "cleaned_data_supabase_final.csv"
MODEL_PKL = ROOT / "models" / "predictive_model.pkl"


class PredictRequest(BaseModel):
    air_temp: float = Field(..., description="Air Temperature")
    process_temp: float = Field(..., description="Process Temperature")
    rotational_speed: int = Field(..., description="Rotational Speed")
    torque: float = Field(..., description="Torque")
    tool_wear: int = Field(..., description="Tool Wear")
    machine_type: Literal["H", "L", "M"] = Field(..., description="Machine Type")


class PredictResponse(BaseModel):
    predicted_failure: bool
    failure_probability: float = Field(..., description="0-1 probability")
    message: str
    recommendation: str


@lru_cache(maxsize=1)
def get_df() -> pd.DataFrame:
    if not DATA_CSV.exists():
        raise FileNotFoundError(f"Missing data file: {DATA_CSV}")
    return pd.read_csv(DATA_CSV)


@lru_cache(maxsize=1)
def get_model() -> Any:
    if not MODEL_PKL.exists():
        raise FileNotFoundError(f"Missing model file: {MODEL_PKL}")
    return joblib.load(MODEL_PKL)


def compute_kpis(df: pd.DataFrame) -> dict[str, Any]:
    failure_rate = round(float(df["machine_failure"].mean()) * 100, 2)
    avg_torque = round(float(df["torque"].mean()), 2)
    avg_tool_wear = round(float(df["tool_wear"].mean()), 2)
    high_risk_count = int(len(df[(df["torque"] > 50) & (df["tool_wear"] > 200)]))
    return {
        "failure_rate_percent": failure_rate,
        "avg_torque": avg_torque,
        "avg_tool_wear": avg_tool_wear,
        "high_risk_machines": high_risk_count,
        "rows": int(len(df)),
    }


def failure_distribution(df: pd.DataFrame) -> list[dict[str, Any]]:
    vc = df["machine_failure"].value_counts().to_dict()
    return [
        {"label": "Normal (0)", "value": int(vc.get(0, 0)), "key": 0},
        {"label": "Failure (1)", "value": int(vc.get(1, 0)), "key": 1},
    ]


def risk_indicators(df: pd.DataFrame) -> list[dict[str, Any]]:
    return [
        {"metric": "Torque", "average": float(df["torque"].mean())},
        {"metric": "Tool Wear", "average": float(df["tool_wear"].mean())},
        {"metric": "Air Temp", "average": float(df["air_temp"].mean())},
        {"metric": "Process Temp", "average": float(df["process_temp"].mean())},
    ]


def predict(req: PredictRequest) -> PredictResponse:
    df = get_df()
    model = get_model()

    type_l = 1 if req.machine_type == "L" else 0
    type_m = 1 if req.machine_type == "M" else 0

    input_data = pd.DataFrame(
        {
            "air_temp": [req.air_temp],
            "process_temp": [req.process_temp],
            "rotational_speed": [req.rotational_speed],
            "torque": [req.torque],
            "tool_wear": [req.tool_wear],
            "twf": [0],
            "hdf": [0],
            "pwf": [0],
            "osf": [0],
            "rnf": [0],
            "type_l": [type_l],
            "type_m": [type_m],
        }
    )

    pred = int(model.predict(input_data)[0])
    proba = float(model.predict_proba(input_data)[0][1])

    if pred == 1:
        return PredictResponse(
            predicted_failure=True,
            failure_probability=proba,
            message=f"High Risk: Machine Failure Predicted ({proba*100:.2f}% probability)",
            recommendation="Immediate maintenance inspection required.",
        )

    return PredictResponse(
        predicted_failure=False,
        failure_probability=proba,
        message=f"Machine Operating Normally ({(1-proba)*100:.2f}% safe probability)",
        recommendation="Continue standard monitoring.",
    )


app = FastAPI(title="Smart Manufacturing API", version="1.0.0")

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(
    ","
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/summary")
def summary() -> dict[str, Any]:
    df = get_df()
    return {
        "kpis": compute_kpis(df),
        "failure_distribution": failure_distribution(df),
        "risk_indicators": risk_indicators(df),
    }


@app.get("/data/sample")
def data_sample(limit: int = 20) -> dict[str, Any]:
    df = get_df()
    lim = max(1, min(int(limit), 200))
    return {"rows": df.head(lim).to_dict(orient="records")}


@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(req: PredictRequest) -> PredictResponse:
    return predict(req)

