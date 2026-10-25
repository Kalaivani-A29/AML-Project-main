"""Encryption utilities for sensitive user data."""

import base64
import hashlib

from cryptography.fernet import Fernet

from config.settings import SECRET_KEY


def _build_fernet() -> Fernet:
    """Create a Fernet encryption object from the project secret."""
    key_bytes = hashlib.sha256(SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_text(plain_text: str) -> str:
    """Encrypt text before storing sensitive fields."""
    return _build_fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_text(cipher_text: str) -> str:
    """Decrypt text when it must be read again."""
    return _build_fernet().decrypt(cipher_text.encode("utf-8")).decode("utf-8")
