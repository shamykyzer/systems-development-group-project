"""Shared route helpers to reduce duplication across blueprints."""

from flask import jsonify


def json_error(message: str, status: int = 400):
    """Return a JSON error response tuple (body, status_code)."""
    return jsonify({"success": False, "message": message}), status


def require_int(name: str, raw) -> int:
    """Parse raw value as int; raise ValueError with helpful message on failure."""
    try:
        return int(raw)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be an integer")
