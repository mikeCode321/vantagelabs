from fastapi import FastAPI
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config.settings import ENV
from logger import Logger
from dependencies import limiter
from routers import contacts, finance

log = Logger(location='main.py')
log.info(f"Starting server on - {ENV}")

app = FastAPI()

app.include_router(contacts.router)
app.include_router(finance.router)

if ENV != "development":
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_exception_handler(
        RateLimitExceeded,
        lambda request, exc: JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Slow down!"}
        )
    )

@app.get("/status")
def status():
    return {"status": "ok"}