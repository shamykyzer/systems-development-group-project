"""
CRUD operations for Prophet preset settings.

All functions accept an open sqlite3.Connection and return plain dicts
(or raise ValueError for bad inputs) so routes.py stays thin.
"""

import json
import sqlite3

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_PRESET_COLUMNS = [
    "preset_name",
    "growth",
    "changepoint_prior_scale",
    "seasonality_prior_scale",
    "seasonality_mode",
    "daily_seasonality",
    "weekly_seasonality",
    "yearly_seasonality",
    "forecast_periods",
    "floor_multiplier",
    "cap_multiplier",
    "custom_seasonality_enabled",
    "custom_seasonality_name",
    "custom_seasonality_period",
    "custom_seasonality_fourier_order",
    "n_changepoints",
    "changepoint_range",
    "interval_width",
    "holidays_prior_scale",
    "holidays",
]

def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convert a DB row into a plain dict, deserialising the holidays JSON field."""
    d = dict(row)
    # holidays is stored as a JSON string; expose it as a Python list
    d["holidays"] = json.loads(d.get("holidays") or "[]")
    return d


def _validate_preset_name(name: str) -> str:
    name = (name or "").strip()
    if not name:
        raise ValueError("preset_name is required")
    if len(name) > 100:
        raise ValueError("preset_name must be 100 characters or fewer")
    return name


# ---------------------------------------------------------------------------
# Public API (used by routes.py)
# ---------------------------------------------------------------------------

def list_presets(conn: sqlite3.Connection) -> list[dict]:
    """Return all presets as a list of dicts (only preset_name included)."""
    rows = conn.execute(
        "SELECT preset_name FROM prophet_presets ORDER BY preset_name"
    ).fetchall()
    return [{"preset_name": row["preset_name"]} for row in rows]


def get_preset(conn: sqlite3.Connection, preset_name: str) -> dict:
    """
    Return all settings for a single preset.
    Raises ValueError if the preset does not exist.
    """
    preset_name = _validate_preset_name(preset_name)
    row = conn.execute(
        "SELECT * FROM prophet_presets WHERE preset_name = ?",
        (preset_name,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Preset '{preset_name}' not found")
    return _row_to_dict(row)


def create_preset(conn: sqlite3.Connection, data: dict) -> dict:
    """
    Create a new preset from *data*.
    Raises ValueError if preset_name is missing/duplicate or data is invalid.
    Returns the newly created preset dict.
    """
    preset_name = _validate_preset_name(data.get("preset_name", ""))

    # Check for duplicate
    existing = conn.execute(
        "SELECT 1 FROM prophet_presets WHERE preset_name = ?", (preset_name,)
    ).fetchone()
    if existing:
        raise ValueError(f"A preset named '{preset_name}' already exists")

    holidays_json = json.dumps(data.get("holidays") or [])

    conn.execute(
        """
        INSERT INTO prophet_presets (
            preset_name, growth, changepoint_prior_scale,
            seasonality_prior_scale, seasonality_mode,
            daily_seasonality, weekly_seasonality, yearly_seasonality,
            forecast_periods, floor_multiplier, cap_multiplier,
            custom_seasonality_enabled, custom_seasonality_name,
            custom_seasonality_period, custom_seasonality_fourier_order,
            n_changepoints, changepoint_range, interval_width,
            holidays_prior_scale, holidays
        ) VALUES (
            :preset_name, :growth, :changepoint_prior_scale,
            :seasonality_prior_scale, :seasonality_mode,
            :daily_seasonality, :weekly_seasonality, :yearly_seasonality,
            :forecast_periods, :floor_multiplier, :cap_multiplier,
            :custom_seasonality_enabled, :custom_seasonality_name,
            :custom_seasonality_period, :custom_seasonality_fourier_order,
            :n_changepoints, :changepoint_range, :interval_width,
            :holidays_prior_scale, :holidays
        )
        """,
        {
            "preset_name":                      preset_name,
            "growth":                           data.get("growth", "linear"),
            "changepoint_prior_scale":          float(data.get("changepoint_prior_scale", 0.05)),
            "seasonality_prior_scale":          float(data.get("seasonality_prior_scale", 10.0)),
            "seasonality_mode":                 data.get("seasonality_mode", "multiplicative"),
            "daily_seasonality":                int(bool(data.get("daily_seasonality", False))),
            "weekly_seasonality":               int(bool(data.get("weekly_seasonality", True))),
            "yearly_seasonality":               int(bool(data.get("yearly_seasonality", True))),
            "forecast_periods":                 int(data.get("forecast_periods", 365)),
            "floor_multiplier":                 float(data.get("floor_multiplier", 0.5)),
            "cap_multiplier":                   float(data.get("cap_multiplier", 1.5)),
            "custom_seasonality_enabled":       int(bool(data.get("custom_seasonality_enabled", False))),
            "custom_seasonality_name":          data.get("custom_seasonality_name", ""),
            "custom_seasonality_period":        float(data.get("custom_seasonality_period", 30.5)),
            "custom_seasonality_fourier_order": int(data.get("custom_seasonality_fourier_order", 3)),
            "n_changepoints":                   int(data.get("n_changepoints", 25)),
            "changepoint_range":                float(data.get("changepoint_range", 0.8)),
            "interval_width":                   float(data.get("interval_width", 0.80)),
            "holidays_prior_scale":             float(data.get("holidays_prior_scale", 10.0)),
            "holidays":                         holidays_json,
        },
    )
    conn.commit()
    return get_preset(conn, preset_name)


def update_preset(conn: sqlite3.Connection, preset_name: str, data: dict) -> dict:
    """
    Update an existing preset's settings.
    Raises ValueError if the preset does not exist.
    Returns the updated preset dict.
    """
    preset_name = _validate_preset_name(preset_name)

    # Verify existence
    get_preset(conn, preset_name)  # raises ValueError if missing

    holidays_json = json.dumps(data.get("holidays") or [])

    conn.execute(
        """
        UPDATE prophet_presets SET
            growth                           = :growth,
            changepoint_prior_scale          = :changepoint_prior_scale,
            seasonality_prior_scale          = :seasonality_prior_scale,
            seasonality_mode                 = :seasonality_mode,
            daily_seasonality                = :daily_seasonality,
            weekly_seasonality               = :weekly_seasonality,
            yearly_seasonality               = :yearly_seasonality,
            forecast_periods                 = :forecast_periods,
            floor_multiplier                 = :floor_multiplier,
            cap_multiplier                   = :cap_multiplier,
            custom_seasonality_enabled       = :custom_seasonality_enabled,
            custom_seasonality_name          = :custom_seasonality_name,
            custom_seasonality_period        = :custom_seasonality_period,
            custom_seasonality_fourier_order = :custom_seasonality_fourier_order,
            n_changepoints                   = :n_changepoints,
            changepoint_range                = :changepoint_range,
            interval_width                   = :interval_width,
            holidays_prior_scale             = :holidays_prior_scale,
            holidays                         = :holidays,
            updated_at                       = CURRENT_TIMESTAMP
        WHERE preset_name = :preset_name
        """,
        {
            "preset_name":                      preset_name,
            "growth":                           data.get("growth", "linear"),
            "changepoint_prior_scale":          float(data.get("changepoint_prior_scale", 0.05)),
            "seasonality_prior_scale":          float(data.get("seasonality_prior_scale", 10.0)),
            "seasonality_mode":                 data.get("seasonality_mode", "multiplicative"),
            "daily_seasonality":                int(bool(data.get("daily_seasonality", False))),
            "weekly_seasonality":               int(bool(data.get("weekly_seasonality", True))),
            "yearly_seasonality":               int(bool(data.get("yearly_seasonality", True))),
            "forecast_periods":                 int(data.get("forecast_periods", 365)),
            "floor_multiplier":                 float(data.get("floor_multiplier", 0.5)),
            "cap_multiplier":                   float(data.get("cap_multiplier", 1.5)),
            "custom_seasonality_enabled":       int(bool(data.get("custom_seasonality_enabled", False))),
            "custom_seasonality_name":          data.get("custom_seasonality_name", ""),
            "custom_seasonality_period":        float(data.get("custom_seasonality_period", 30.5)),
            "custom_seasonality_fourier_order": int(data.get("custom_seasonality_fourier_order", 3)),
            "n_changepoints":                   int(data.get("n_changepoints", 25)),
            "changepoint_range":                float(data.get("changepoint_range", 0.8)),
            "interval_width":                   float(data.get("interval_width", 0.80)),
            "holidays_prior_scale":             float(data.get("holidays_prior_scale", 10.0)),
            "holidays":                         holidays_json,
        },
    )
    conn.commit()
    return get_preset(conn, preset_name)


def delete_preset(conn: sqlite3.Connection, preset_name: str) -> None:
    """
    Delete a preset by name.
    Raises ValueError if the preset does not exist or if an attempt is made
    to delete the protected 'Default' preset.
    """
    preset_name = _validate_preset_name(preset_name)

    if preset_name == "Default":
        raise ValueError("Cannot delete the Default preset")

    # Verify existence
    get_preset(conn, preset_name)  # raises ValueError if missing

    conn.execute(
        "DELETE FROM prophet_presets WHERE preset_name = ?", (preset_name,)
    )

    # If the deleted preset was active, fall back to Default
    conn.execute(
        "UPDATE active_preset SET preset_name = 'Default' WHERE id = 1 AND preset_name = ?",
        (preset_name,),
    )

    conn.commit()


# ---------------------------------------------------------------------------
# Active preset helpers
# ---------------------------------------------------------------------------

def get_active_preset(conn: sqlite3.Connection) -> str:
    """Return the name of the currently active preset (falls back to 'Default')."""
    row = conn.execute(
        "SELECT preset_name FROM active_preset WHERE id = 1"
    ).fetchone()
    return row["preset_name"] if row else "Default"


def set_active_preset(conn: sqlite3.Connection, preset_name: str) -> str:
    """
    Persist the active preset selection.
    Raises ValueError if the named preset doesn't exist.
    Returns the (validated) preset name.
    """
    preset_name = _validate_preset_name(preset_name)

    # Verify the preset exists
    get_preset(conn, preset_name)  # raises ValueError if missing

    conn.execute(
        "INSERT INTO active_preset (id, preset_name) VALUES (1, ?) "
        "ON CONFLICT(id) DO UPDATE SET preset_name = excluded.preset_name",
        (preset_name,),
    )
    conn.commit()
    return preset_name
