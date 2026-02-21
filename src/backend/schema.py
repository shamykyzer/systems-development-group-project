SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_filename TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee','food'))
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sales_dataset_date ON sales(dataset_id, date);
CREATE INDEX IF NOT EXISTS idx_sales_item_date ON sales(item_id, date);

CREATE TABLE IF NOT EXISTS model_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  train_start TEXT NOT NULL,
  train_end TEXT NOT NULL,
  horizon_days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  params_json TEXT,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_run_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  yhat REAL NOT NULL,
  yhat_lower REAL,
  yhat_upper REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forecasts_run_date ON forecasts(model_run_id, date);

CREATE TABLE IF NOT EXISTS evaluation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_id INTEGER NOT NULL,
  algorithm TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  params_json TEXT,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluation_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluation_run_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluation_run_id) REFERENCES evaluation_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_eval_run_item ON evaluation_metrics(evaluation_run_id, item_id);

CREATE TABLE IF NOT EXISTS prophet_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_name TEXT UNIQUE NOT NULL,
  growth TEXT NOT NULL DEFAULT 'linear',
  changepoint_prior_scale REAL NOT NULL DEFAULT 0.05,
  seasonality_prior_scale REAL NOT NULL DEFAULT 10.0,
  seasonality_mode TEXT NOT NULL DEFAULT 'multiplicative',
  daily_seasonality INTEGER NOT NULL DEFAULT 0,
  weekly_seasonality INTEGER NOT NULL DEFAULT 1,
  yearly_seasonality INTEGER NOT NULL DEFAULT 1,
  forecast_periods INTEGER NOT NULL DEFAULT 365,
  floor_multiplier REAL NOT NULL DEFAULT 0.5,
  cap_multiplier REAL NOT NULL DEFAULT 1.5,
  custom_seasonality_enabled INTEGER NOT NULL DEFAULT 0,
  custom_seasonality_name TEXT DEFAULT '',
  custom_seasonality_period REAL DEFAULT 30.5,
  custom_seasonality_fourier_order INTEGER DEFAULT 3,
  n_changepoints INTEGER NOT NULL DEFAULT 25,
  changepoint_range REAL NOT NULL DEFAULT 0.8,
  interval_width REAL NOT NULL DEFAULT 0.80,
  holidays_prior_scale REAL NOT NULL DEFAULT 10.0,
  holidays TEXT DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default preset
INSERT OR IGNORE INTO prophet_presets (
  preset_name, growth, changepoint_prior_scale, seasonality_prior_scale,
  seasonality_mode, daily_seasonality, weekly_seasonality, yearly_seasonality,
  forecast_periods, floor_multiplier, cap_multiplier, custom_seasonality_enabled,
  custom_seasonality_name, custom_seasonality_period, custom_seasonality_fourier_order,
  n_changepoints, changepoint_range, interval_width, holidays_prior_scale, holidays, is_active
) VALUES (
  'Default', 'linear', 0.05, 10.0, 'multiplicative', 0, 1, 1, 365, 0.5, 1.5, 0, '', 30.5, 3,
  25, 0.8, 0.80, 10.0, '[]', 1
);
"""
