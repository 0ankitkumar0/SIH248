from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import optimize, forecast

app = FastAPI(title="SAIL Rake Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optimize.router)
app.include_router(forecast.router)

@app.get("/")
def root():
    return {"status": "ok"}
