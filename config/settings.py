"""Central settings for the AML blockchain project."""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "project_data"
FRONTEND_DIR = BASE_DIR / "frontend"

PROCESSED_DATA_FILE = DATA_DIR / "processed_transactions.json"
BLOCKCHAIN_LOG_FILE = DATA_DIR / "blockchain_log.json"
USERS_FILE = DATA_DIR / "users.json"

SECRET_KEY = os.getenv("AML_SECRET_KEY", "aml-demo-secret-key")
SESSION_SECRET_KEY = os.getenv("AML_SESSION_SECRET_KEY", SECRET_KEY)
WEB3_PROVIDER_URL = os.getenv("WEB3_PROVIDER_URL", "http://127.0.0.1:7545")
HOST = os.getenv("AML_HOST", "127.0.0.1")
PORT = int(os.getenv("AML_PORT", "5000"))
DEFAULT_STARTING_BALANCE = float(os.getenv("AML_STARTING_BALANCE", "25000"))
RECENT_TRANSACTION_LIMIT = 8
