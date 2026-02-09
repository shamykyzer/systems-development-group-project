#!/usr/bin/env bash
set -euo pipefail

# One-command backend test runner:
# - ensures venv + deps
# - starts backend in background (if not already running)
# - waits for /api
# - runs the smoke test script
# - stops backend (if started by this script)

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"
DB_PATH="${DB_PATH:-data/test_run.db}"

backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$script_dir/status_marker.sh"
status_marker_trap_exit "backend_test_run.sh"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install Python 3.12+ first." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for this test run." >&2
  exit 1
fi

ensure_venv() {
  cd "$backend_dir"
  if [[ ! -d ".venv" ]]; then
    echo "Creating venv at $backend_dir/.venv ..."
    if ! python3 -m venv .venv 2>/tmp/venv_err.log; then
      echo "Failed to create venv. On Ubuntu/Debian you likely need:" >&2
      echo "  sudo apt update && sudo apt install -y python3.12-venv" >&2
      echo "--- venv error ---" >&2
      cat /tmp/venv_err.log >&2 || true
      exit 1
    fi
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  export PIP_DISABLE_PIP_VERSION_CHECK=1
  pip install --no-input -r requirements.txt >/dev/null || pip install --no-input -r requirements.txt
}

health_ok() {
  # /api returns {"status":"running", ...} when the backend is up.
  curl -sS "$BASE_URL/api" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"running"'
}

wait_for_health() {
  local tries=40
  local i=1
  while [[ $i -le $tries ]]; do
    if health_ok; then
      return 0
    fi
    sleep 0.25
    i=$((i + 1))
  done
  return 1
}

echo "Backend test run"
echo "- BASE_URL: $BASE_URL"
echo "- DB_PATH:  $DB_PATH"
echo

ensure_venv

started_by_script="0"
server_pid=""

cleanup() {
  if [[ "$started_by_script" == "1" ]] && [[ -n "$server_pid" ]]; then
    echo
    echo "Stopping backend (pid=$server_pid) ..."
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if health_ok; then
  echo "Backend already running at $BASE_URL (health OK). Using it."
else
  echo "Starting backend in background ..."
  cd "$backend_dir"
  # Use an isolated DB so smoke tests don't pollute the dev DB.
  : "${FLASK_ENV:=production}"
  : "${MPLCONFIGDIR:=/tmp/matplotlib}"
  export FLASK_ENV MPLCONFIGDIR
  DATABASE_PATH="$DB_PATH" PORT=5001 FLASK_DEBUG=0 ./.venv/bin/python app.py >/tmp/pinkcafe_backend_test_run.log 2>&1 &
  server_pid="$!"
  started_by_script="1"

  if ! wait_for_health; then
    echo "Backend failed to become healthy. Last logs:" >&2
    tail -n 80 /tmp/pinkcafe_backend_test_run.log >&2 || true
    exit 1
  fi
  echo "Backend is up."
fi

echo
echo "Running smoke test..."
BASE_URL="$BASE_URL" "$backend_dir/tests/backend_smoke_test.sh"

echo
echo "All done."

