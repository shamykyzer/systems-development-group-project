#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install Python 3.12+ first." >&2
  exit 1
fi

if [[ ! -d ".venv" ]]; then
  echo "Creating venv at .venv ..."
  if ! python3 -m venv .venv 2>/tmp/venv_err.log; then
    echo "Failed to create venv. On Ubuntu/Debian you likely need:" >&2
    echo "  sudo apt update && sudo apt install -y python3.12-venv" >&2
    echo "--- venv error ---" >&2
    cat /tmp/venv_err.log >&2 || true
    exit 1
  fi
fi

source .venv/bin/activate
export PIP_DISABLE_PIP_VERSION_CHECK=1
pip install --no-input -r requirements.txt >/dev/null || pip install --no-input -r requirements.txt

echo
echo "Starting backend on http://127.0.0.1:5001 ..."
# Default to debug OFF to avoid environments where the Werkzeug debugger can't write to /dev/shm.
: "${FLASK_DEBUG:=0}"
: "${FLASK_ENV:=production}"
: "${PORT:=5001}"
: "${MPLCONFIGDIR:=/tmp/matplotlib}"
export FLASK_DEBUG FLASK_ENV PORT MPLCONFIGDIR

exec python app.py

