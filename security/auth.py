"""Local authentication helpers using JSON storage."""

import hashlib
import json
from datetime import datetime

from config.settings import DEFAULT_STARTING_BALANCE, USERS_FILE
from security.encryption import decrypt_text, encrypt_text



def _load_users() -> list[dict]:
    """Read users from local storage."""
    if not USERS_FILE.exists():
        return []
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))



def _save_users(users: list[dict]) -> None:
    """Persist users to local storage."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")



def _hash_password(password: str) -> str:
    """Hash a password for simple demo authentication."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()



def _normalize_user_type(user_type: str) -> str:
    """Normalize incoming user type values to supported classifications."""
    normalized = str(user_type or "standard").strip().lower()
    if normalized == "premium":
        return "premium"
    return "standard"



def _serialize_user(user: dict) -> dict:
    """Return a safe user object without password hash."""
    return {
        "username": user["username"],
        "email": decrypt_text(user["email_encrypted"]),
        "balance": round(float(user.get("balance", 0)), 2),
        "risk_level": user.get("risk_level", "Low"),
        "user_type": _normalize_user_type(user.get("user_type", "standard")),
        "transactions": user.get("transactions", []),
        "created_at": user.get("created_at"),
    }



def get_all_users() -> list[dict]:
    """Return all stored users without password hashes."""
    return [_serialize_user(user) for user in _load_users()]



def get_user(username: str) -> dict | None:
    """Fetch one user by username."""
    for user in _load_users():
        if user["username"] == username:
            return _serialize_user(user)
    return None



def register_user(payload: dict) -> dict:
    """Register a user after basic validation."""
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", "")).strip()
    email = str(payload.get("email", "")).strip()
    balance = float(payload.get("balance") or DEFAULT_STARTING_BALANCE)
    user_type = _normalize_user_type(payload.get("user_type", "standard"))

    if len(username) < 3 or len(password) < 6:
        return {
            "success": False,
            "message": "Username must be 3+ characters and password must be 6+ characters.",
        }

    if "@" not in email:
        return {"success": False, "message": "Please enter a valid email address."}

    users = _load_users()
    if any(user["username"] == username for user in users):
        return {"success": False, "message": "Username already exists."}

    user = {
        "username": username,
        "password_hash": _hash_password(password),
        "email_encrypted": encrypt_text(email),
        "balance": round(balance, 2),
        "risk_level": "Low",
        "user_type": user_type,
        "transactions": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    users.append(user)
    _save_users(users)
    return {
        "success": True,
        "message": "User registered successfully.",
        "user": _serialize_user(user),
    }



def authenticate_user(username: str, password: str) -> dict:
    """Check whether user credentials match stored values."""
    password_hash = _hash_password(password)
    users = _load_users()

    for user in users:
        if user["username"] == username and user["password_hash"] == password_hash:
            return {
                "success": True,
                "message": "Login successful.",
                "user": _serialize_user(user),
            }

    return {"success": False, "message": "Invalid username or password."}



def update_user_record(username: str, updater) -> dict | None:
    """Apply an update function to a stored user and save the result."""
    users = _load_users()

    for index, user in enumerate(users):
        if user["username"] == username:
            users[index] = updater(user)
            users[index]["user_type"] = _normalize_user_type(users[index].get("user_type", "standard"))
            _save_users(users)
            return _serialize_user(users[index])

    return None
