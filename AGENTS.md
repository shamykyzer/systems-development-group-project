# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is the **ui** branch of the Pink Cafe Bakery Sales Prediction Dashboard. Two services:

| Service | Tech | Port | Start command |
|---------|------|------|---------------|
| Backend | Flask + SQLite + Prophet | 5001 | `cd backend && source .venv/bin/activate && python3 app.py` |
| Frontend | React (CRA) | 3000 | `cd frontend && npm start` |

See `README.md` for full endpoint reference, test scripts, and Docker workflows.

### Directory layout (ui branch)

The `ui` branch has a reorganized layout compared to `main`:
- `backend/` (not `src/backend/`)
- `frontend/` (not `pinkcafe/`)
- `tests/scripts/` for test shell scripts
- `docker/` for Dockerfile and docker-compose.yml

### Node version

The frontend requires **Node.js 18** (react-scripts 5.0.1 is incompatible with Node 22+). Use `nvm use 18` before any frontend command. Node 18 is set as the nvm default.

### Backend startup caveats

- The backend venv is at `backend/.venv`.
- Set `MPLCONFIGDIR=/tmp/matplotlib` to avoid matplotlib config permission issues.
- Set `FLASK_DEBUG=0` to avoid Werkzeug debugger issues with `/dev/shm` in containerized environments.
- CmdStan (required by Prophet) is installed at `~/.cmdstan`.

### Frontend proxy

In `frontend/package.json`, the `proxy` field is `http://backend:5001` (Docker service name). For local dev, set `REACT_APP_API_URL=http://localhost:5001` or call the backend API directly.

### Lint

- Backend: `cd backend && source .venv/bin/activate && ruff check .` (ruff config in `backend/ruff.toml`; 6 pre-existing unused-import warnings).
- Frontend: ESLint runs as part of `npx react-scripts build` (configured via `react-app` preset in `package.json`).

### Testing

- Backend smoke test (one command): `./tests/scripts/backend_test_run.sh`
- Frontend build check: `cd frontend && npx react-scripts build`
- No pytest or Jest test suites yet; testing is script-based.
