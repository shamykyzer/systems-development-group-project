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
"""

