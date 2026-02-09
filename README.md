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
- **Backend**: Flask API in `pinkcafe/backend/` (Python + SQLite).

### Backend changes implemented so far

- **Normalized backend path**: the backend directory is now `pinkcafe/backend/` (lowercase) to match Docker/Compose on Linux.
- **Modular Flask backend**: moved from a single monolithic Flask script to a small module layout with an **app factory**, **config**, and **blueprints** under `routes/`.
- **Normalized SQLite schema**: added tables for `datasets`, `items`, `sales`, forecasting runs, and evaluation metrics (foundation for forecasting/evaluation features).
- **CSV ingestion API**: upload wide-column CSVs and persist them into the normalized schema. This supports both coffee CSV header styles currently in the repo.
- **Analytics API**: endpoints to list items, compute top sellers over a 4-week window, and return a 4-week daily fluctuation series for an item.
- **Forecasting API**: Prophet + a baseline algorithm, with `train_weeks` control (4–8) and 4-week horizon.
- **Evaluation API**: run simple evaluation/backtesting and store/query metrics for dashboard display.
- **Auth hardening (backend)**: switched password hashing to **bcrypt**, and kept backward-compatible `/api/login` + `/api/register` aliases for the existing frontend.

### Backend package layout (important files)

- `pinkcafe/backend/app.py`: **entrypoint** (keeps `python3 app.py` working in Docker/local)
- `pinkcafe/backend/api_factory.py`: `create_app()` app factory + blueprint registration
- `pinkcafe/backend/config.py`: env-driven config (`DATABASE_PATH`, `CORS_ORIGINS`, etc.)
- `pinkcafe/backend/db.py`: SQLite connect + schema init
- `pinkcafe/backend/schema.py`: SQLite schema (`datasets/items/sales/model_runs/forecasts/evaluation_*`)
- `pinkcafe/backend/routes/`: Flask blueprints (health/auth/datasets/analytics/forecast/evaluation)
- `pinkcafe/backend/services/`: CSV parsing, analytics, forecasting (Prophet + baseline), evaluation, passwords (bcrypt)
- `pinkcafe/backend/CSV_Files/`: sample datasets used by scripts/tests
- `pinkcafe/backend/scripts/`: helper scripts for local dev + API smoke tests
- `pinkcafe/backend/csv_import.py`: **local CLI importer** that loads a wide CSV into the normalized schema (`datasets/items/sales`) using the same parsing logic as the API (`services/csv_ingest.py`)

### Backend scripts (what to run and when)

- **Start the backend (local dev)**: `pinkcafe/backend/scripts/backend_run.sh`
  - Creates `.venv` if missing, installs requirements, then runs `python app.py`.
- **Smoke test (assumes backend is already running)**: `pinkcafe/backend/scripts/backend_smoke_test.sh`
  - Uploads the sample CSVs in `pinkcafe/backend/CSV_Files/` and calls the analytics endpoints.
- **One-command backend test run (start → smoke test → stop)**: `pinkcafe/backend/scripts/backend_test_run.sh`
  - Starts the backend with an isolated DB (`DB_PATH`, default `data/test_run.db`), runs the smoke test, then stops the backend.
- **Full “tour” test (includes forecast + zoom + evaluation)**: `pinkcafe/backend/test_run.sh`
  - Runs a longer end-to-end sequence beyond the smoke test (baseline forecast, zoom, evaluation).

### Local CSV import helper (CLI)

If you want to import a CSV **without** using the API upload endpoint, use the CLI importer:

```bash
cd pinkcafe/backend
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
./pinkcafe/backend/scripts/backend_run.sh
```

#### Manual start (if you prefer)

```bash
cd pinkcafe/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Health check:

```bash
curl -s http://127.0.0.1:5000/api/v1/health
```

## Tests

The backend currently uses **scripted smoke/tour tests** (not a `pytest` suite yet).

### 1-command backend smoke test

With the backend running, this uploads the sample coffee + croissant CSVs and hits the analytics endpoints:

```bash
./pinkcafe/backend/scripts/backend_smoke_test.sh
```

What the smoke test does:
- **Checks health**: `GET /api/v1/health`
- **Uploads + ingests sample CSVs** from `pinkcafe/backend/CSV_Files/`:
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
./pinkcafe/backend/scripts/backend_test_run.sh
```

If you are already inside `pinkcafe/backend/`, you can also run:

```bash
./test_run.sh
```

### Backend API quick test (CSV ingest + analytics)

Run these from the **repo root**:

Upload/ingest a coffee CSV:

```bash
curl -s -X POST http://127.0.0.1:5000/api/v1/datasets \
  -F "category=coffee" \
  -F "name=coffee-march-oct-2025" \
  -F "file=@pinkcafe/backend/CSV_Files/Pink CoffeeSales March - Oct 2025.csv"
```

List datasets:

```bash
curl -s http://127.0.0.1:5000/api/v1/datasets
```

List items in a dataset (used to get `item_id`):

```bash
curl -s "http://127.0.0.1:5000/api/v1/items?dataset_id=1"
```

Top sellers (last 4 weeks):

```bash
curl -s "http://127.0.0.1:5000/api/v1/analytics/top-sellers?dataset_id=1&category=coffee&weeks=4&limit=3"
```

Fluctuation series (last 4 weeks):

```bash
curl -s "http://127.0.0.1:5000/api/v1/analytics/fluctuation?dataset_id=1&item_id=1&weeks=4"
```

### Implemented backend endpoints (so far)

- **Health**
  - `GET /api/v1/health`

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

- `DATABASE_PATH`: SQLite DB file path (default `data/pinkcafe.db` under `pinkcafe/backend/`)
- `CORS_ORIGINS`: CORS origins (default `*`)
- `FLASK_ENV` (or `ENV`): environment (default `development`)
- `FLASK_DEBUG`: debug flag (`1/true/yes`)
- `SECRET_KEY`: Flask secret key (dev default is not suitable for production)

### Docker

#### Docker Compose (recommended: frontend + backend)

From the repo root:

```bash
docker compose up --build
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- The backend’s SQLite DB persists via the `backend-db` named volume mounted at `/app/data` (default `DATABASE_PATH=data/pinkcafe.db`).

#### Backend-only Docker image

```bash
docker build -f Dockerfile.backend -t pinkcafe-backend .
docker run --rm -p 5000:5000 -e FLASK_ENV=development pinkcafe-backend
```

#### Standalone Prophet batch job (PNG output)

The repo root `Dockerfile` runs `pinkcafe/backend/Prophet.py` and writes PNGs to `/app/output`.

```bash
docker build -t pinkcafe-prophet .
mkdir -p output
docker run --rm -v "$(pwd)/output:/app/output" pinkcafe-prophet
```

## Repo Structure (current)

```
systems-development-group-project/
├── docker-compose.yml
├── Dockerfile                  # standalone Prophet batch job (runs Prophet.py)
├── Dockerfile.backend
├── README.md
└── pinkcafe/
   ├── Dockerfile.frontend      # React dev server
   ├── backend/                 # Flask API (this is the backend we’re building)
   │  ├── app.py
   │  ├── CSV_Files/
   │  │  ├── Pink CoffeeSales March - Oct 2025.csv
   │  │  └── Pink CroissantSales March - Oct 2025.csv
   │  ├── routes/
   │  ├── services/
   │  ├── requirements.txt
   │  └── scripts/
   ├── src/                     # React frontend
   ├── package.json
   └── package-lock.json
```