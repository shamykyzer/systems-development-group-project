#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$script_dir/status_marker.sh"
status_marker_trap_exit "backend_smoke_test.sh"

# Resolve repo root robustly (works from any CWD)
if command -v git >/dev/null 2>&1; then
  repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || true)"
else
  repo_root=""
fi
if [[ -z "$repo_root" ]]; then
  repo_root="$(cd "$script_dir/../../.." && pwd)"
fi

coffee_csv="${COFFEE_CSV:-$repo_root/src/backend/CSV_Files/Pink CoffeeSales March - Oct 2025.csv}"
food_csv="${FOOD_CSV:-$repo_root/src/backend/CSV_Files/Pink CroissantSales March - Oct 2025.csv}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for this smoke test." >&2
  exit 1
fi

json_get() {
  local url="$1"
  curl -sS "$url"
}

json_post_dataset() {
  local category="$1"
  local name="$2"
  local file="$3"
  if [[ ! -f "$file" ]]; then
    echo "CSV file not found: $file" >&2
    exit 1
  fi
  curl -sS -X POST "$BASE_URL/api/v1/datasets" \
    -F "category=$category" \
    -F "name=$name" \
    -F "file=@$file"
}

extract_json_field() {
  # usage: echo "$json" | extract_json_field 'dataset.id'
  local expr="$1"
  python3 -c 'import json,sys; expr=sys.argv[1].split("."); obj=json.load(sys.stdin); 
for k in expr: obj=obj[k]
print(obj)' "$expr"
}

echo "1) Backend status: $BASE_URL/api"
json_get "$BASE_URL/api" | python3 -m json.tool

echo
echo "2) Upload coffee dataset (category=coffee)"
echo "   - file: $coffee_csv"
coffee_resp="$(json_post_dataset "coffee" "coffee-smoke" "$coffee_csv")"
echo "$coffee_resp" | python3 -m json.tool
coffee_ds_id="$(echo "$coffee_resp" | extract_json_field 'dataset.id')"

echo
echo "3) Upload food dataset (category=food)"
echo "   - file: $food_csv"
food_resp="$(json_post_dataset "food" "food-smoke" "$food_csv")"
echo "$food_resp" | python3 -m json.tool
if ! echo "$food_resp" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else 1)" 2>/dev/null; then
  echo "Food dataset upload failed. Check CSV format (first column must be 'Date')." >&2
  exit 1
fi
food_ds_id="$(echo "$food_resp" | extract_json_field 'dataset.id')"

echo
echo "4) List items for coffee dataset_id=$coffee_ds_id"
items_json="$(json_get "$BASE_URL/api/v1/items?dataset_id=$coffee_ds_id")"
echo "$items_json" | python3 -m json.tool

item_id="$(python3 -c 'import json,sys; items=json.loads(sys.stdin.read()); print(items[0]["id"] if items else "")' <<<"$items_json")"

echo
echo "5) Top sellers (coffee, last 4 weeks)"
json_get "$BASE_URL/api/v1/analytics/top-sellers?dataset_id=$coffee_ds_id&category=coffee&weeks=4&limit=3" | python3 -m json.tool

echo
echo "6) Fluctuation (coffee, last 4 weeks, item_id=$item_id)"
json_get "$BASE_URL/api/v1/analytics/fluctuation?dataset_id=$coffee_ds_id&item_id=$item_id&weeks=4" | python3 -m json.tool

echo
echo "Smoke test complete."

