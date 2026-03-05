"""
Database helpers for the Pink Cafe backend.

Uses SQLite via the standard library - no ORM needed.
connect() is used throughout routes.py to get a DB connection.
init_db() is called once on startup from app.py.
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
import os

# --- Schema ---
SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_filename TEXT,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee', 'food'))
);

CREATE TABLE IF NOT EXISTS sales (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  date       TEXT NOT NULL,
  item_id    INTEGER NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity >= 0),
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)    REFERENCES items(id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sales_dataset_date ON sales(dataset_id, date);
CREATE INDEX IF NOT EXISTS idx_sales_item_date    ON sales(item_id, date);

-- Prophet preset tables
CREATE TABLE IF NOT EXISTS prophet_presets (
  id                               INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_name                      TEXT UNIQUE NOT NULL,
  growth                           TEXT    NOT NULL DEFAULT 'linear',
  changepoint_prior_scale          REAL    NOT NULL DEFAULT 0.15,
  seasonality_prior_scale          REAL    NOT NULL DEFAULT 15.0,
  seasonality_mode                 TEXT    NOT NULL DEFAULT 'additive',
  daily_seasonality                INTEGER NOT NULL DEFAULT 0,
  weekly_seasonality               INTEGER NOT NULL DEFAULT 1,
  yearly_seasonality               INTEGER NOT NULL DEFAULT 0,
  forecast_periods                 INTEGER NOT NULL DEFAULT 365,
  floor_multiplier                 REAL    NOT NULL DEFAULT 0.5,
  cap_multiplier                   REAL    NOT NULL DEFAULT 1.5,
  custom_seasonality_enabled       INTEGER NOT NULL DEFAULT 0,
  custom_seasonality_name          TEXT    NOT NULL DEFAULT '',
  custom_seasonality_period        REAL    NOT NULL DEFAULT 30.5,
  custom_seasonality_fourier_order INTEGER NOT NULL DEFAULT 3,
  n_changepoints                   INTEGER NOT NULL DEFAULT 25,
  changepoint_range                REAL    NOT NULL DEFAULT 0.8,
  interval_width                   REAL    NOT NULL DEFAULT 0.80,
  holidays_prior_scale             REAL    NOT NULL DEFAULT 10.0,
  holidays                         TEXT    NOT NULL DEFAULT '[]',
  created_at                       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores which preset is currently active (always exactly one row with id=1)
CREATE TABLE IF NOT EXISTS active_preset (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  preset_name TEXT NOT NULL DEFAULT 'Default'
);
"""


@contextmanager
def connect(db_path: str) -> Iterator[sqlite3.Connection]:
    """Open a SQLite connection with foreign keys enabled, yield it, then close it."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row          # rows behave like dicts
        conn.execute("PRAGMA foreign_keys = ON;")
        yield conn
    finally:
        conn.close()


def init_db(db_path: str) -> None:
    """Create all tables and seed required rows if they don't already exist (idempotent)."""
    # Lazy import to avoid a hard dep at module level
    from services import hash_password

    with connect(db_path) as conn:
        conn.executescript(SCHEMA_SQL)

        # Seed the Default prophet preset if it doesn't exist yet
        conn.execute(
            "INSERT OR IGNORE INTO prophet_presets (preset_name) VALUES ('Default')"
        )
        
        # Update Default preset to use optimized settings for short-term forecasting
        conn.execute("""
            UPDATE prophet_presets 
            SET 
                changepoint_prior_scale = 0.15,
                seasonality_prior_scale = 15.0,
                seasonality_mode = 'additive',
                yearly_seasonality = 0
            WHERE preset_name = 'Default'
        """)

        # Seed the active_preset singleton row (id=1 always)
        conn.execute(
            "INSERT OR IGNORE INTO active_preset (id, preset_name) VALUES (1, 'Default')"
        )

        # Seed default admin account (credentials overridable via env vars)
        seed_email    = os.getenv("SEED_ADMIN_EMAIL",    "admin@pinkcafe.com")
        seed_password = os.getenv("SEED_ADMIN_PASSWORD", "pinkcafe2025")
        seed_username = os.getenv("SEED_ADMIN_USERNAME", "admin")
        conn.execute(
            "INSERT OR IGNORE INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (seed_username, seed_email, hash_password(seed_password)),
        )

        conn.commit()

