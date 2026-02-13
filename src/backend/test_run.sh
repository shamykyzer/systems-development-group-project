#!/usr/bin/env bash
set -euo pipefail

# End-to-end backend tour test runner (one command).
# Keeps existing tests intact:
# - tests/backend_run.sh
# - tests/backend_smoke_test.sh
# - tests/backend_test_run.sh
#
# This script starts a clean backend instance on a non-default port with a fresh DB,
# exercises ingestion + analytics + baseline forecast + zoom + evaluation, then stops.

backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$backend_dir" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  repo_root="$(cd "$backend_dir/../.." && pwd)"
fi

BASE_URL="${BASE_URL:-http://127.0.0.1:5005}"
PORT="${PORT:-5005}"
DB_PATH="${DB_PATH:-data/test_run.db}"

script_dir="$backend_dir/tests"
# shellcheck disable=SC1091
source "$script_dir/status_marker.sh"
status_marker_trap_exit "test_run.sh"

COFFEE_CSV_DEFAULT_1="$repo_root/pinkcafe/Pink CoffeeSales March - Oct 2025.csv"
COFFEE_CSV_DEFAULT_2="$backend_dir/Pink CoffeeSales March - Oct 2025.csv"
COFFEE_CSV_DEFAULT_3="$backend_dir/CSV_Files/Pink CoffeeSales March - Oct 2025.csv"

FOOD_CSV_DEFAULT_1="$repo_root/pinkcafe/Pink CroissantSales March - Oct 2025.csv"
FOOD_CSV_DEFAULT_2="$backend_dir/Pink CroissantSales March - Oct 2025.csv"
FOOD_CSV_DEFAULT_3="$backend_dir/CSV_Files/Pink CroissantSales March - Oct 2025.csv"

COFFEE_CSV="${COFFEE_CSV:-$COFFEE_CSV_DEFAULT_1}"
FOOD_CSV="${FOOD_CSV:-$FOOD_CSV_DEFAULT_1}"

if [[ ! -f "$COFFEE_CSV" ]]; then
  for candidate in "$COFFEE_CSV_DEFAULT_2" "$COFFEE_CSV_DEFAULT_3"; do
    if [[ -f "$candidate" ]]; then
      COFFEE_CSV="$candidate"
      break
    fi
  done
fi

if [[ ! -f "$FOOD_CSV" ]]; then
  for candidate in "$FOOD_CSV_DEFAULT_2" "$FOOD_CSV_DEFAULT_3"; do
    if [[ -f "$candidate" ]]; then
      FOOD_CSV="$candidate"
      break
    fi
  done
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for test_run.sh" >&2
  exit 1
fi

ensure_venv() {
  cd "$backend_dir"
  if [[ ! -d ".venv" ]]; then
    echo "Creating venv at $backend_dir/.venv ..." >&2
    if ! python3 -m venv .venv 2>/tmp/venv_err.log; then
      echo "Failed to create venv. On Ubuntu/Debian you likely need:" >&2
      echo "  sudo apt update && sudo apt install -y python3.12-venv" >&2
      echo "--- venv error ---" >&2
      cat /tmp/venv_err.log >&2 || true
      exit 1
    fi
  fi
  . .venv/bin/activate
  # Avoid `pip install --upgrade pip` here: it adds unnecessary network dependency.
  # If requirements are already installed, this is a no-op; otherwise it will
  # attempt to fetch missing wheels.
  export PIP_DISABLE_PIP_VERSION_CHECK=1
  pip install --no-input -r requirements.txt >/dev/null || pip install --no-input -r requirements.txt
}

wait_for_health() {
  local tries=50
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$BASE_URL/api" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done
  return 1
}

pretty_json() {
  python3 -m json.tool 2>/dev/null || cat
}

echo "Backend tour test"
echo "- BASE_URL: $BASE_URL"
echo "- DB_PATH:  $DB_PATH"
echo

if [[ ! -f "$COFFEE_CSV" ]]; then
  echo "Coffee CSV not found: $COFFEE_CSV" >&2
  exit 1
fi
if [[ ! -f "$FOOD_CSV" ]]; then
  echo "Food CSV not found: $FOOD_CSV" >&2
  exit 1
fi

ensure_venv

cd "$backend_dir"
rm -f "$DB_PATH" 2>/dev/null || true

echo "Starting backend (port=$PORT) ..."
PORT="$PORT" DATABASE_PATH="$DB_PATH" FLASK_DEBUG=0 ./.venv/bin/python - <<'PY' >/tmp/pinkcafe_backend_tour_test.log 2>&1 &
import os
from api_factory import create_app
from config import load_config

cfg = load_config()
cfg = type(cfg)(
    env=cfg.env,
    debug=False,
    secret_key=cfg.secret_key,
    cors_origins=cfg.cors_origins,
    database_path=os.environ["DATABASE_PATH"],
)
app = create_app(cfg)
app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5005")), debug=False)
PY
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  wait "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

export PORT
if ! wait_for_health; then
  echo "Backend did not become healthy. Last logs:" >&2
  tail -n 120 /tmp/pinkcafe_backend_tour_test.log >&2 || true
  exit 1
fi

echo
echo "1) Backend status (/api)"
curl -sS "$BASE_URL/api" | pretty_json

echo
echo "2) Upload coffee dataset"
COFFEE_RESP="$(curl -sS -X POST "$BASE_URL/api/v1/datasets" \
  -F "category=coffee" \
  -F "name=tour-coffee" \
  -F "file=@$COFFEE_CSV")"
echo "$COFFEE_RESP" | pretty_json
DS_ID="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['dataset']['id'])" "$COFFEE_RESP")"

echo
echo "3) Upload food dataset"
FOOD_RESP="$(curl -sS -X POST "$BASE_URL/api/v1/datasets" \
  -F "category=food" \
  -F "name=tour-food" \
  -F "file=@$FOOD_CSV")"
echo "$FOOD_RESP" | pretty_json

echo
echo "4) List items (coffee dataset_id=$DS_ID)"
ITEMS="$(curl -sS "$BASE_URL/api/v1/items?dataset_id=$DS_ID")"
echo "$ITEMS" | pretty_json
ITEM_ID="$(python3 -c "import json,sys; items=json.loads(sys.argv[1]); print(items[0]['id'] if items else '')" "$ITEMS")"
if [[ -z "$ITEM_ID" ]]; then
  echo "No items returned; ingestion failed" >&2
  exit 1
fi

echo
echo "5) Top sellers (last 4 weeks)"
curl -sS "$BASE_URL/api/v1/analytics/top-sellers?dataset_id=$DS_ID&category=coffee&weeks=4&limit=3" | pretty_json

echo
echo "6) Fluctuation (last 4 weeks, item_id=$ITEM_ID)"
curl -sS "$BASE_URL/api/v1/analytics/fluctuation?dataset_id=$DS_ID&item_id=$ITEM_ID&weeks=4" | pretty_json | head -n 60

echo
echo "7) Baseline forecast (train_weeks=6, horizon_weeks=4)"
FC="$(curl -sS "$BASE_URL/api/v1/forecast?dataset_id=$DS_ID&item_id=$ITEM_ID&train_weeks=6&horizon_weeks=4&algorithm=baseline")"
echo "$FC" | pretty_json | head -n 80
RUN_ID="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['model_run_id'])" "$FC")"
START="$(python3 -c "import json,sys; f=json.loads(sys.argv[1])['forecast']; print(f[0]['date'])" "$FC")"
END="$(python3 -c "import json,sys; f=json.loads(sys.argv[1])['forecast']; print(f[6]['date'])" "$FC")"

echo
echo "8) Forecast zoom (first 7 days)"
curl -sS "$BASE_URL/api/v1/forecast/zoom?model_run_id=$RUN_ID&start=$START&end=$END" | pretty_json

echo
echo "9) Evaluation (baseline, coffee)"
curl -sS -X POST "$BASE_URL/api/v1/evaluation/run" \
  -H 'Content-Type: application/json' \
  -d "{\"dataset_id\": $DS_ID, \"algorithms\": [\"baseline\"], \"train_weeks\": 6, \"horizon_weeks\": 4, \"category\": \"coffee\"}" \
  | pretty_json | head -n 120

echo
echo "Tour test complete."

