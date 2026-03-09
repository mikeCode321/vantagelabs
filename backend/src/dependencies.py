from database import SessionLocal
from slowapi import Limiter
from slowapi.util import get_remote_address
from config.settings import ENV

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if ENV != "development":
    limiter = Limiter(key_func=get_remote_address)
else:
    class DummyLimiter:
        def limit(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
    limiter = DummyLimiter()