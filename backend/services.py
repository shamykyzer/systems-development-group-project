"""
Password helpers for the Pink Cafe backend.
Uses bcrypt for secure storage - passwords are never stored in plain text.
"""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt (cost 12)."""
    if not password:
        raise ValueError("password is required")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Return True if the plain-text password matches the stored bcrypt hash."""
    if not password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False
