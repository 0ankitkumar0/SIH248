from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from ml import simple_forecast

router = APIRouter()

class ForecastRequest(BaseModel):
    data: Any = None

class ForecastResponse(BaseModel):
    forecast: list
    note: str | None = None

@router.post('/forecast', response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    f = simple_forecast.predict_mock(req.data)
    return {'forecast': f, 'note': 'dummy forecast'}
