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
from forecasting import ForecastError, run_forecast
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


    # --- Prophet Test (Hardcoded CSV) --------------------------------------

    @app.post("/api/upload/csv")
    def upload_csv():
        """
        Upload and process a CSV file containing sales data.
        Stores data in database and returns validation/preview info.
        """
        import pandas as pd
        import os
        from werkzeug.utils import secure_filename
        
        if 'file' not in request.files:
            return _err("No file uploaded", 400)
        
        file = request.files['file']
        
        if file.filename == '':
            return _err("No file selected", 400)
        
        if not file.filename.endswith('.csv'):
            return _err("File must be a CSV", 400)
        
        try:
            # Read CSV
            df = pd.read_csv(file)
            
            # Validate CSV structure
            if 'Date' not in df.columns:
                return _err("CSV must have a 'Date' column", 400)
            
            # Parse dates
            try:
                df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')
            except:
                return _err("Dates must be in dd/mm/yyyy format", 400)
            
            # Get product columns (everything except Date)
            product_cols = [col for col in df.columns if col != 'Date']
            
            if not product_cols:
                return _err("CSV must have at least one product column", 400)
            
            # Validation checks
            has_negatives = (df[product_cols] < 0).any().any()
            has_missing = df[product_cols].isnull().any().any()
            is_chronological = df['Date'].is_monotonic_increasing
            
            # Store in database
            with connect(_db()) as conn:
                # Create dataset entry
                cursor = conn.execute(
                    "INSERT INTO datasets (name, source_filename) VALUES (?, ?)",
                    (secure_filename(file.filename), file.filename)
                )
                dataset_id = cursor.lastrowid
                
                # Create/get item entries
                item_ids = {}
                for col in product_cols:
                    # Try to categorize (simple heuristic)
                    category = 'coffee' if 'coffee' in col.lower() or 'cappuccino' in col.lower() or 'americano' in col.lower() else 'food'
                    
                    cursor = conn.execute(
                        "INSERT OR IGNORE INTO items (name, category) VALUES (?, ?)",
                        (col, category)
                    )
                    
                    item_row = conn.execute(
                        "SELECT id FROM items WHERE name = ?", (col,)
                    ).fetchone()
                    item_ids[col] = item_row['id']
                
                # Insert sales data
                for _, row in df.iterrows():
                    date_str = row['Date'].strftime('%Y-%m-%d')
                    for col in product_cols:
                        quantity = int(row[col]) if pd.notna(row[col]) else 0
                        conn.execute(
                            "INSERT INTO sales (dataset_id, date, item_id, quantity) VALUES (?, ?, ?, ?)",
                            (dataset_id, date_str, item_ids[col], quantity)
                        )
                
                conn.commit()
            
            # Calculate statistics
            stats = {}
            for col in product_cols:
                stats[col] = {
                    'avg': float(df[col].mean()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
            
            # Return validation and preview data
            return jsonify({
                "success": True,
                "dataset_id": dataset_id,
                "fileName": file.filename,
                "dateRange": {
                    "start": df['Date'].min().strftime('%d/%m/%Y'),
                    "end": df['Date'].max().strftime('%d/%m/%Y')
                },
                "products": product_cols,
                "rowCount": len(df),
                "daysOfData": len(df),
                "monthsOfData": round(len(df) / 30.4, 1),
                "stats": stats,
                "preview": df.head(10).to_dict(orient='records'),
                "validationChecks": {
                    "validDates": True,
                    "noMissingValues": not has_missing,
                    "noNegatives": not has_negatives,
                    "chronological": is_chronological,
                    "productsDetected": len(product_cols)
                },
                "item_ids": item_ids
            })
            
        except Exception as e:
            import traceback
            return _err(f"Failed to process CSV: {str(e)}\n{traceback.format_exc()}", 500)

    # --- Prophet Test (Hardcoded CSV) --------------------------------------

    @app.get("/api/prophet/test")
    def prophet_test():
        """
        TEST ENDPOINT: Load hardcoded CSV data and run Prophet forecast.
        Query params:
          - horizon_weeks: Number of weeks to forecast (default: 4)
          - train_weeks:  Number of weeks to train on (default: 20)
        Returns forecast data as JSON for dashboard testing.
        """
        import pandas as pd
        import os
        from forecasting import _prophet_forecast
        
        try:
            # Get query parameters
            horizon_weeks = request.args.get('horizon_weeks', '4')
            train_weeks = request.args.get('train_weeks', '20')
            
            try:
                horizon_weeks = int(horizon_weeks)
                train_weeks = int(train_weeks)
            except ValueError:
                return _err("horizon_weeks and train_weeks must be integers", 400)
            
            if not (1 <= horizon_weeks <= 52):
                return _err("horizon_weeks must be between 1 and 52", 400)
            
            if not (4 <= train_weeks <= 52):
                return _err("train_weeks must be between 4 and 52", 400)
            
            # Load hardcoded CSV file
            csv_path = os.path.join(os.path.dirname(__file__), "CSV_Files", "Pink CoffeeSales March - Oct 2025.csv")
            
            if not os.path.exists(csv_path):
                return _err(f"CSV file not found at {csv_path}", 404)
            
            # Load CSV
            df = pd.read_csv(csv_path)
            df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')
            
            # Get first item column (skip 'Date')
            item_columns = [col for col in df.columns if col != 'Date']
            if not item_columns:
                return _err("No sales columns found in CSV", 400)
            
            item_name = item_columns[0]
            
            # Prepare Prophet format
            history = pd.DataFrame({
                'ds': df['Date'],
                'y': df[item_name]
            })
            
            # Use last N weeks for training
            cutoff_date = history["ds"].max() - pd.Timedelta(weeks=train_weeks)
            history = history[history["ds"] >= cutoff_date].copy()
            
            # Run forecast
            horizon_days = horizon_weeks * 7
            
            with connect(_db()) as conn:
                forecast_df = _prophet_forecast(history, horizon_days, conn)
            
            # Convert to JSON-serializable format
            forecast_df["date"] = forecast_df["date"].astype(str)
            
            return jsonify({
                "success": True,
                "item_name": item_name,
                "train_weeks": train_weeks,
                "horizon_weeks": horizon_weeks,
                "training_data_points": len(history),
                "forecast": forecast_df.to_dict(orient="records")
            })
            
        except Exception as e:
            import traceback
            return _err(f"Prophet test failed: {str(e)}\n{traceback.format_exc()}", 500)
