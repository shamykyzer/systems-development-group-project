# Backend / Docker change log

Last updated: 2026-02-09  
Branch at time of work: `backend`

## Overview
Goal: **use only the root `Dockerfile`** (pulled from `main`) and make the **backend consistently run on port 5001**, with the frontend calling the backend on **5001**.

## Docker / Compose
- **Removed per-service Dockerfiles** (using the single root Dockerfile instead):
  - Deleted `Dockerfile.backend`
  - Deleted `pinkcafe/Dockerfile.frontend`

- **Root `Dockerfile` updated/standardized** to a single multi-stage build:
  - **Frontend build stage**: installs deps and runs `npm run build`
  - **Python deps stage**: creates venv and installs backend deps (incl. Prophet deps)
  - **Dev targets**: `backend`, `frontend`, `prophet`
  - **Combined runtime target**: `app` runs gunicorn and serves built React assets via Flask when `FRONTEND_DIR` is set
  - **Port change**: backend now exposes/binds **5001** (was 5000)

- **`docker-compose.yml` updated** to align with the single root `Dockerfile` and port 5001:
  - `backend` service:
    - builds from root `Dockerfile` with `target: backend`
    - maps ports **`5001:5001`**
    - sets `PORT=5001`
  - `frontend` service:
    - builds from root `Dockerfile` with `target: frontend`
    - sets `REACT_APP_API_URL=http://localhost:5001`
  - `prophet` service:
    - builds from root `Dockerfile` with `target: prophet`
  - `app` (combined runtime) service:
    - builds from root `Dockerfile` with `target: app`
    - maps ports **`5001:5001`**
    - sets `PORT=5001`
    - moved under `profiles: [prod]` to avoid clashing with the dev `backend` service when running `docker compose up`

## Backend (Flask)
- **Backend entrypoint now uses env var `PORT` (default 5001)** so Docker/Compose can force port 5001:
  - Updated `pinkcafe/backend/app.py` to:
    - read `PORT` from environment (default `"5001"`)
    - run `app.run(..., port=port)`
  - Updated `pinkcafe/Backend/app.py` similarly (repo contains both `Backend/` and `backend/`)

- **Login endpoint confirmed**:
  - `POST /api/login` exists as a backward-compatible alias
  - `POST /api/v1/auth/login` also exists

## Frontend (React)
- **Login API wiring aligned to port 5001**:
  - `pinkcafe/src/components/LoginForm.jsx`:
    - defaults API base to `http://localhost:5001`
    - updates the connectivity error text to:  
      “Could not reach the backend. Is it running on port 5001?”
    - keeps redirect on successful login: `navigate('/home')`

- **NavBar build fix** (eslint/no-undef in Docker build):
  - `pinkcafe/src/components/NavBar.jsx` now imports `useState`:
    - `import React, { useState } from 'react';`

- **CRA proxy updated**:
  - `pinkcafe/package.json` proxy set to `http://localhost:5001`

## Notes / gotchas encountered
- **Docker container name conflict** can happen when `container_name:` is set in compose and old containers exist.
  - Fix by removing old containers (`docker rm -f ...`) or running `docker compose down --remove-orphans`.

