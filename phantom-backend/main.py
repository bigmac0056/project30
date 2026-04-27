from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import auth_router, users, sessions

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Phantom EMG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(sessions.router)


@app.get("/health")
def health():
    return {"status": "ok"}
