"""
All API route handlers for the Pink Cafe backend.

Call register_routes(app) from app.py to attach everything to the Flask app.

Endpoints:
  GET  /api                  - health check
  POST /api/v1/auth/register - create account
  POST /api/v1/auth/login    - log in
  GET  /api/v1/forecast      - run a Prophet (or baseline) forecast
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Prophet'))

from flask import Flask, jsonify, request, current_app
from db import connect
from services import hash_password, verify_password
from prophet import ForecastError, run_forecast
from prophet_settings import (
    list_presets,
    get_preset,
    create_preset,
    update_preset,
    delete_preset,
    get_active_preset,
    set_active_preset,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _err(message: str, status: int = 400):
    """Return a JSON error response."""
    return jsonify({"success": False, "message": message}), status


def _int(name: str, raw) -> int:
    """Parse a query-string value to int, raising ValueError with a readable message."""
    try:
        return int(raw)
    except Exception:
        raise ValueError(f"{name} must be an integer")


def _db() -> str:
    """Get the configured DB path from the Flask app config."""
    return current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")


# ---------------------------------------------------------------------------
# Route registration
# ---------------------------------------------------------------------------

def register_routes(app: Flask) -> None:

    # --- Health check -------------------------------------------------------

    @app.get("/api")
    def health():
        return jsonify({"message": "Pink Cafe API", "status": "ok"})


    # --- Auth ---------------------------------------------------------------

    @app.post("/api/v1/auth/register")
    def register():
        """Create a new user account. Body: {username, email, password}"""
        data = request.get_json(silent=True) or {}
        username = (data.get("username") or "").strip()
        email    = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not username or not email or not password:
            return _err("username, email, and password are required")

        with connect(_db()) as conn:
            try:
                conn.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    (username, email, hash_password(password)),
                )
                conn.commit()
                return jsonify({"success": True, "message": "Registered successfully"}), 201
            except Exception:
                # Generic message to avoid revealing which field was duplicate
                return _err("Username or email already exists")


    @app.post("/api/v1/auth/login")
    def login():
        """Log in. Body: {email, password}. Returns basic user info on success."""
        data = request.get_json(silent=True) or {}
        email    = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        if not email or not password:
            return _err("email and password are required")

        with connect(_db()) as conn:
            user = conn.execute(
                "SELECT id, username, email, password_hash FROM users WHERE email = ?",
                (email,),
            ).fetchone()

        if not user or not verify_password(password, user["password_hash"]):
            return _err("Invalid email or password", 401)

        return jsonify({
            "success": True,
            "user": {"id": int(user["id"]), "username": user["username"], "email": user["email"]},
        })


    # --- Forecast -----------------------------------------------------------

    @app.get("/api/v1/forecast")
    def get_forecast():
        """
        Run a sales forecast. Query params:
          dataset_id   - required
          item_id      - required
          algorithm    - 'prophet' (default) or 'baseline'
          train_weeks  - weeks of history to train on (4-8, default 6)
          horizon_weeks - weeks to forecast into the future (default 4)
        """
        dataset_id_raw   = request.args.get("dataset_id")
        item_id_raw      = request.args.get("item_id")
        train_weeks_raw  = request.args.get("train_weeks", "6")
        horizon_weeks_raw = request.args.get("horizon_weeks", "4")
        algorithm        = request.args.get("algorithm", "prophet")

        if not dataset_id_raw:
            return _err("dataset_id is required")
        if not item_id_raw:
            return _err("item_id is required")

        try:
            dataset_id    = _int("dataset_id", dataset_id_raw)
            item_id       = _int("item_id", item_id_raw)
            train_weeks   = _int("train_weeks", train_weeks_raw)
            horizon_weeks = _int("horizon_weeks", horizon_weeks_raw)
        except ValueError as e:
            return _err(str(e))

        with connect(_db()) as conn:
            try:
                return jsonify(run_forecast(
                    conn,
                    dataset_id=dataset_id,
                    item_id=item_id,
                    algorithm=algorithm,
                    train_weeks=train_weeks,
                    horizon_weeks=horizon_weeks,
                ))
            except ForecastError as e:
                return _err(str(e))


    # --- Prophet preset settings -------------------------------------------

    @app.get("/api/prophet/presets")
    def prophet_list_presets():
        """List all available preset names."""
        with connect(_db()) as conn:
            return jsonify(list_presets(conn))

    @app.post("/api/prophet/presets")
    def prophet_create_preset():
        """Create a new preset. Body: {preset_name, ...settings}"""
        data = request.get_json(silent=True) or {}
        with connect(_db()) as conn:
            try:
                preset = create_preset(conn, data)
                return jsonify(preset), 201
            except ValueError as e:
                return _err(str(e))

    @app.get("/api/prophet/presets/<string:preset_name>")
    def prophet_get_preset(preset_name: str):
        """Return the settings for a single preset."""
        with connect(_db()) as conn:
            try:
                return jsonify(get_preset(conn, preset_name))
            except ValueError as e:
                return _err(str(e), 404)

    @app.put("/api/prophet/presets/<string:preset_name>")
    def prophet_update_preset(preset_name: str):
        """Update all settings for an existing preset. Body: {...settings}"""
        data = request.get_json(silent=True) or {}
        with connect(_db()) as conn:
            try:
                preset = update_preset(conn, preset_name, data)
                return jsonify(preset)
            except ValueError as e:
                return _err(str(e), 404)

    @app.delete("/api/prophet/presets/<string:preset_name>")
    def prophet_delete_preset(preset_name: str):
        """Delete a preset (cannot delete 'Default')."""
        with connect(_db()) as conn:
            try:
                delete_preset(conn, preset_name)
                return jsonify({"success": True, "message": f"Preset '{preset_name}' deleted"})
            except ValueError as e:
                status = 400 if "Cannot delete" in str(e) else 404
                return _err(str(e), status)

    @app.get("/api/prophet/active-preset")
    def prophet_get_active_preset():
        """Return the name of the currently active preset."""
        with connect(_db()) as conn:
            return jsonify({"preset_name": get_active_preset(conn)})

    @app.put("/api/prophet/active-preset")
    def prophet_set_active_preset():
        """Set the active preset. Body: {preset_name}"""
        data = request.get_json(silent=True) or {}
        preset_name = (data.get("preset_name") or "").strip()
        with connect(_db()) as conn:
            try:
                name = set_active_preset(conn, preset_name)
                return jsonify({"success": True, "preset_name": name})
            except ValueError as e:
                return _err(str(e), 404)
