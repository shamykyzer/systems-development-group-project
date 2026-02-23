from flask import Blueprint, current_app, jsonify, request

from db import connect
from services.passwords import hash_password, verify_password


bp = Blueprint("auth", __name__)


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


@bp.post("/api/v1/auth/register")
@bp.post("/api/register")  # backward-compatible alias for older frontend
def register():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return _json_error("JSON body must be an object", 400)

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return _json_error("username, email, and password are required", 400)

    pw_hash = hash_password(password)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            conn.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                (username, email, pw_hash),
            )
            conn.commit()
            return jsonify({"success": True, "message": "User registered successfully"}), 201
        except Exception:  # noqa: BLE001
            # Keep message generic so we don't leak which field was duplicate
            return _json_error("Username or email already exists", 400)


@bp.post("/api/v1/auth/login")
@bp.post("/api/login")  # backward-compatible alias for older frontend
def login():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return _json_error("JSON body must be an object", 400)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return _json_error("email and password are required", 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        user = conn.execute(
            "SELECT id, username, email, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        return _json_error("Invalid email or password", 401)

    return jsonify(
        {
            "success": True,
            "message": "Login successful",
            "user": {"id": int(user["id"]), "username": user["username"], "email": user["email"]},
        }
    )

