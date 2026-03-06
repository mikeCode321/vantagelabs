# config.py
import os
from pathlib import Path

# Environment
ENV = os.getenv("ENV", "development")  # development / production / staging

# Logging
BASE_DIR = Path(__file__).parent
LOG_FILE = os.getenv("LOG_FILE", str(BASE_DIR / "test.log"))

# Database (example)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")

# Any other reusable constants
API_PREFIX = "/api"
MAX_REQUESTS_PER_MINUTE = 5