#!/usr/bin/env bash
set -euo pipefail

# Shared helper for tests to toggle the backend status marker.
# Requires:
# - BASE_URL set (defaults to http://127.0.0.1:5001)
# - curl available

: "${BASE_URL:=http://127.0.0.1:5001}"

status_marker_set_failed() {
  local source="${1:-unknown}"
  local exit_code="${2:-1}"
  curl -sS -X POST "$BASE_URL/api/v1/status/marker" \
    -H "Content-Type: application/json" \
    -d "{\"inactive\": true, \"reason\": \"test_failed\", \"source\": \"${source}\", \"exit_code\": ${exit_code}}" \
    >/dev/null 2>&1 || true
}

status_marker_clear() {
  curl -sS -X DELETE "$BASE_URL/api/v1/status/marker" >/dev/null 2>&1 || true
}

status_marker_trap_exit() {
  local source="${1:-unknown}"
  # Default to "active" unless a test fails.
  status_marker_clear
  trap 'rc=$?; if [[ $rc -ne 0 ]]; then status_marker_set_failed "'"$source"'" "$rc"; else status_marker_clear; fi' EXIT
}

