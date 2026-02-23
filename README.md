# 🥐 SDGP – Bakery Sales Prediction System

Welcome to the official repository for **Bristol-Pink's Bakery Sales Prediction Dashboard** — a standalone AI-powered system designed to help reduce food waste and optimize daily inventory across five bakery cafés.

## Project Overview

Bristol-Pink is a growing bakery chain serving families near school academies and nearby office workers. To minimize food waste and improve operational efficiency, this system uses machine learning algorithms to forecast daily sales of key products.

The dashboard provides interactive visualizations of historical sales data and predictive analytics to guide purchasing decisions for the next four weeks.

## Objectives

- Analyze historical sales data of top-selling items.
- Predict future sales using AI/ML models.
- Minimize food waste and financial loss.
- Provide flexible, user-driven data exploration.

## Features

- **CSV Data Ingestion**: Upload and process sales data in CSV format.
- **Top Sellers Analysis**:
  - Identify top 3 selling foods and coffees.
  - Visualize their sales fluctuations over the past 4 weeks.
- **Sales Prediction**:
  - Apply AI/ML algorithms to forecast sales for the next 4 weeks.
  - Display predictions in separate, item-specific graphs.
- **Zoom & Focus**:
  - Select a custom date range to zoom into detailed predictions.
- **Training Period Control**:
  - Choose training data length (4–8 weeks).
  - Compare prediction accuracy across different training windows.
  - View results in both tabular and graphical formats.
- **Model Evaluation**:
  - Optional dashboard view to assess algorithm performance and accuracy.

## Technologies Used

- Python (Flask, SQLite, Pandas, Prophet)
- React (Create React App)
- Matplotlib / Plotly-style time series visualization (backend can generate chart-ready series; `Prophet.py` generates PNGs)
- Docker / Docker Compose (dev workflow)
- CSV ingestion + normalization (wide-column CSVs)

## Current Implementation Notes (Pink Cafe)

This repo currently contains:
- **Frontend**: React app in `pinkcafe/` (Create React App).
- **Backend**: Flask API source in `src/backend/` (Python + SQLite).

### Backend changes implemented so far

- **Normalized backend path**: the backend directory is now `src/backend/`.
- **Modular Flask backend**: moved from a single monolithic Flask script to a small module layout with an **app factory**, **config**, and **blueprints** under `routes/`.
- **Normalized SQLite schema**: added tables for `datasets`, `items`, `sales`, forecasting runs, and evaluation metrics (foundation for forecasting/evaluation features).
- **CSV ingestion API**: upload wide-column CSVs and persist them into the normalized schema. This supports both coffee CSV header styles currently in the repo.
- **Analytics API**: endpoints to list items, compute top sellers over a 4-week window, and return a 4-week daily fluctuation series for an item.
- **Forecasting API**: Prophet + a baseline algorithm, with `train_weeks` control (4–8) and 4-week horizon.
- **Evaluation API**: run simple evaluation/backtesting and store/query metrics for dashboard display.
- **Auth hardening (backend)**: switched password hashing to **bcrypt**, and kept backward-compatible `/api/login` + `/api/register` aliases for the existing frontend.

### Backend package layout (important files)

- `src/backend/app.py`: **entrypoint** (keeps `python3 app.py` working in Docker/local)
- `src/backend/api_factory.py`: `create_app()` app factory + blueprint registration
- `src/backend/config.py`: env-driven config (`DATABASE_PATH`, `CORS_ORIGINS`, etc.)
- `src/backend/db.py`: SQLite connect + schema init
- `src/backend/schema.py`: SQLite schema (`datasets/items/sales/model_runs/forecasts/evaluation_*`)
- `src/backend/routes/`: Flask blueprints (health/auth/datasets/analytics/forecast/evaluation)
- `src/backend/services/`: CSV parsing, analytics, forecasting (Prophet + baseline), evaluation, passwords (bcrypt)
- `src/backend/CSV_Files/`: sample datasets used by scripts/tests
- `src/backend/tests/`: helper test scripts for local dev + API smoke tests
- `src/backend/csv_import.py`: **local CLI importer** that loads a wide CSV into the normalized schema (`datasets/items/sales`) using the same parsing logic as the API (`services/csv_ingest.py`)

### Backend test scripts (what to run and when)

- **Start the backend (local dev)**: `src/backend/tests/backend_run.sh`
  - Creates `.venv` if missing, installs requirements, then runs `python app.py`.
- **Smoke test (assumes backend is already running)**: `src/backend/tests/backend_smoke_test.sh`
  - Uploads the sample CSVs in `src/backend/CSV_Files/` and calls the analytics endpoints.
- **One-command backend test run (start → smoke test → stop)**: `src/backend/tests/backend_test_run.sh`
  - Starts the backend with an isolated DB (`DB_PATH`, default `data/test_run.db`), runs the smoke test, then stops the backend.
- **Full “tour” test (includes forecast + zoom + evaluation)**: `src/backend/test_run.sh`
  - Runs a longer end-to-end sequence beyond the smoke test (baseline forecast, zoom, evaluation).

### Local CSV import helper (CLI)

If you want to import a CSV **without** using the API upload endpoint, use the CLI importer:

```bash
cd src/backend
python3 csv_import.py --csv CSV_Files/"Pink CoffeeSales March - Oct 2025.csv" --category coffee --name coffee-sample
```

This imports into the **current normalized tables** (`datasets/items/sales`). The legacy `coffee_sales` table approach is no longer used.

### Run the backend locally (Flask)

Prereqs (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y python3.12-venv
```

#### Easiest way (helper script)

This creates the venv (if missing), installs deps, then starts the API:

```bash
./src/backend/tests/backend_run.sh
```

#### Manual start (if you prefer)

```bash
cd src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Health check:

```bash
curl -s http://127.0.0.1:5001/api
```

## Tests

The backend currently uses **scripted smoke/tour tests** (not a `pytest` suite yet).

### 1-command backend smoke test

With the backend running, this uploads the sample coffee + croissant CSVs and hits the analytics endpoints:

```bash
./src/backend/tests/backend_smoke_test.sh
```

What the smoke test does:
- **Checks backend status**: `GET /api`
- **Uploads + ingests sample CSVs** from `src/backend/CSV_Files/`:
  - Coffee (`category=coffee`): `Pink CoffeeSales March - Oct 2025.csv`
  - Food (`category=food`): `Pink CroissantSales March - Oct 2025.csv`
- **Calls analytics** on the uploaded dataset:
  - `GET /api/v1/items?dataset_id=...` (to discover an `item_id`)
  - `GET /api/v1/analytics/top-sellers?...` (last 4 weeks)
  - `GET /api/v1/analytics/fluctuation?...` (last 4 weeks)

A successful run prints JSON responses for each step and ends with **“Smoke test complete.”**

### 1-command backend test run (recommended)

This does everything in one command: sets up the venv/deps, starts the backend (if needed), runs the smoke test, then stops the backend.

```bash
./src/backend/tests/backend_test_run.sh
```

If you are already inside `src/backend/`, you can also run:

```bash
./test_run.sh
```

### Backend API quick test (CSV ingest + analytics)

Run these from the **repo root**:

Upload/ingest a coffee CSV:

```bash
curl -s -X POST http://127.0.0.1:5001/api/v1/datasets \
  -F "category=coffee" \
  -F "name=coffee-march-oct-2025" \
  -F "file=@src/backend/CSV_Files/Pink CoffeeSales March - Oct 2025.csv"
```

List datasets:

```bash
curl -s http://127.0.0.1:5001/api/v1/datasets
```

List items in a dataset (used to get `item_id`):

```bash
curl -s "http://127.0.0.1:5001/api/v1/items?dataset_id=1"
```

Top sellers (last 4 weeks):

```bash
curl -s "http://127.0.0.1:5001/api/v1/analytics/top-sellers?dataset_id=1&category=coffee&weeks=4&limit=3"
```

Fluctuation series (last 4 weeks):

```bash
curl -s "http://127.0.0.1:5001/api/v1/analytics/fluctuation?dataset_id=1&item_id=1&weeks=4"
```

### Implemented backend endpoints (so far)

- **Auth**
  - `POST /api/v1/auth/register` (JSON: `username`, `email`, `password`)
    - Alias (legacy frontend): `POST /api/register`
  - `POST /api/v1/auth/login` (JSON: `email`, `password`)
    - Alias (legacy frontend): `POST /api/login`

- **Datasets (CSV ingestion)**
  - `POST /api/v1/datasets` (multipart form: `file`, `name`, `category`)
  - `GET /api/v1/datasets`

- **Items**
  - `GET /api/v1/items`
    - params: `dataset_id` (required), `category=coffee|food` (optional)

- **Analytics**
  - `GET /api/v1/analytics/top-sellers`
    - params: `dataset_id` (required), `category=coffee|food` (required), `weeks` (optional), `limit` (optional)
  - `GET /api/v1/analytics/fluctuation`
    - params: `dataset_id` (required), `item_id` (required), `weeks` (optional)

- **Forecasting**
  - `GET /api/v1/forecast`
    - params: `dataset_id` (required), `item_id` (required), `algorithm=prophet|baseline` (optional), `train_weeks=4..8` (optional), `horizon_weeks` (optional)
  - `GET /api/v1/forecast/zoom`
    - params: `model_run_id` (required), `start=YYYY-MM-DD` (required), `end=YYYY-MM-DD` (required)

- **Evaluation**
  - `POST /api/v1/evaluation/run` (JSON body; see route for fields)
  - `GET /api/v1/evaluation/results`
    - params: `run_id` (required)

### Backend config (env vars)

- `DATABASE_PATH`: SQLite DB file path (default `data/pinkcafe.db` under `src/backend/`)
- `CORS_ORIGINS`: CORS origins (default `*`)
- `FLASK_ENV` (or `ENV`): environment (default `development`)
- `FLASK_DEBUG`: debug flag (`1/true/yes`)
- `SECRET_KEY`: Flask secret key (dev default is not suitable for production)
- `STATUS_FORCE_INACTIVE`: if true, forces the backend `/` status page to show **Inactive** (UI testing)
- `STATUS_MARKER_FILE`: optional override path for the status marker file (used by test scripts)
- `API_FORCE_DOWN`: if true, forces all `/api*` requests to return `503` (UI testing)
- `SKIP_DB_INIT`: if true, skips database init on startup (useful for failure simulations)
- `ALLOW_DB_STARTUP_FAILURE`: if true, the backend will start even if DB init fails (useful for failure simulations)

### Docker

#### Docker Compose (recommended: frontend + backend)

From the repo root:

```bash
docker compose up --build
```

- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3000`
- Backend landing page (API-only mode): `GET /` shows a small status page with a **pulsing red “Live”** indicator (dark theme).
- API home: `GET /api`
- The backend’s SQLite DB persists via the `backend-db` named volume mounted at `/app/data` (default `DATABASE_PATH=data/pinkcafe.db`).

## Testing “inactive / down” states (UI + status page)

This repo supports a few intentional failure modes so you can see:
- how the **frontend behaves** when the API is down, and/or
- how the backend **status page** (`/`) shows **Inactive**.

### 1) Backend status page forced Inactive (grey badge)

This keeps the backend running, but forces the **`/` status page** to render **Inactive**.

```bash
docker compose down
docker compose --profile testing up --build --force-recreate backend_inactive
```

Open:
- `http://localhost:5002/` → **Inactive** badge (grey, smaller, labeled “Inactive”)

Notes:
- This only affects the status page; API routes may still work.
- This uses host port `5002` (so it won’t conflict with a backend already running on `5001`).

### 2) Backend status page goes Inactive due to DB failure

This runs the backend on host port `5003` but points `DATABASE_PATH` somewhere invalid so the DB check fails and the status page flips to **Inactive**.

```bash
docker compose down
docker compose --profile testing up --build --force-recreate backend_db_fail
```

Open:
- `http://localhost:5003/` → **Inactive** (reason: DB unreachable)

### 3) Backend status page goes Inactive after a failed test script

The backend exposes a marker endpoint used by scripts:
- `POST /api/v1/status/marker` sets an “inactive” marker
- `DELETE /api/v1/status/marker` clears it

The scripts below now auto-clear the marker when they start, and set it if they exit non‑zero:
- `src/backend/tests/backend_smoke_test.sh`
- `src/backend/tests/backend_test_run.sh`
- `src/backend/test_run.sh`

#### Steps

1) Start the backend normally (so you can see `/` update):

```bash
docker compose down
docker compose up --build --force-recreate backend
```

2) Run a script in a bash environment (WSL or Git Bash). To force a failure, point a CSV env var at a missing file:

```bash
cd src/backend
COFFEE_CSV="does-not-exist.csv" ./tests/backend_smoke_test.sh
```

3) Refresh:
- `http://localhost:5001/` → should show **Inactive** (reason: test failed)

4) Run the script again without forcing a failure. On success the marker is cleared and the page returns to **Live** (as long as DB check passes).

### 4) Frontend when backend is not running (connection refused)

If you want the frontend to call `http://localhost:5001` but **nothing is listening**, run only the frontend (no backend container):

```bash
docker compose down
docker compose up --build --no-deps frontend
```

Open:
- `http://localhost:3000/` → the UI should display whatever “API down / network error” state your frontend implements.

### 5) Frontend served on 5001 but API intentionally down (all `/api*` return 503)

This is useful if you want the site to load from `:5001` but every API call fails.

```bash
docker compose down
docker compose --profile testing up --build --force-recreate app_inactive
```

Open:
- `http://localhost:5001/` → React app loads
- Any `http://localhost:5001/api...` call → `503` (`backend_disabled`)

To stop and remove containers:

```bash
docker compose down --remove-orphans
```

#### Production (single container serving API + built frontend)

This uses the `app` service (behind the `prod` profile) and serves the React build from Flask:

```bash
docker compose --profile prod up --build
```

- App/API: `http://localhost:5001`

#### Backend-only Docker image (without Compose)

Build the backend target from the root `Dockerfile`:

```bash
docker build --target backend -t pinkcafe-backend .
docker run --rm -p 5001:5001 -e PORT=5001 -e FLASK_ENV=development pinkcafe-backend
```

#### Prophet batch job (PNG output)

The root `Dockerfile` has a `prophet` target that runs `src/backend/Prophet.py` and writes PNGs to `/app/output`.

```bash
docker build --target prophet -t pinkcafe-prophet .
mkdir -p output
docker run --rm -v "$(pwd)/output:/app/output" pinkcafe-prophet
```

## Repo Structure (current)

```
systems-development-group-project/
├── docker-compose.yml
├── Dockerfile                  # multi-stage (frontend build, backend, app, prophet)
├── README.md
├── src/
│  └── backend/                 # Flask API source
└── pinkcafe/
   ├── src/                     # React frontend
   ├── package.json
   └── package-lock.json
```