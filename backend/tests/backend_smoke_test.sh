#!/usr/bin/env bash
# backend_smoke_test.sh
# ---------------------------------------------------------------------------
# Quick smoke tests against a running Pink Cafe backend.
# Set BASE_URL to override the default (e.g. CI points at the container port).
#
# Usage:
#   ./backend/tests/backend_smoke_test.sh
#   BASE_URL="http://127.0.0.1:8080" ./backend/tests/backend_smoke_test.sh
# ---------------------------------------------------------------------------

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"
PASS=0
FAIL=0

# Colours
GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'

pass() { echo -e "${GREEN}PASS${RESET}  $1"; ((PASS++)); }
fail() { echo -e "${RED}FAIL${RESET}  $1 — $2"; ((FAIL++)); }

# Assert HTTP status code
expect_status() {
    local label="$1" expected="$2"
    shift 2
    local actual
    actual=$(curl -s -o /dev/null -w "%{http_code}" "$@")
    if [[ "$actual" == "$expected" ]]; then
        pass "$label (HTTP $expected)"
    else
        fail "$label" "expected HTTP $expected, got $actual"
    fi
}

# Assert body contains a substring
expect_body() {
    local label="$1" needle="$2"
    shift 2
    local body
    body=$(curl -s "$@")
    if echo "$body" | grep -q "$needle"; then
        pass "$label"
    else
        fail "$label" "expected '$needle' in response: $body"
    fi
}

echo "Smoke testing: $BASE_URL"
echo "-------------------------------------------"

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
expect_status "GET /api health check" 200 \
    "$BASE_URL/api"

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
expect_status "POST /api/v1/auth/login — bad credentials → 401" 401 \
    -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@example.com","password":"wrong"}'

expect_status "POST /api/v1/auth/login — valid credentials → 200" 200 \
    -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@pinkcafe.com","password":"pinkcafe2025"}'

expect_body "Login response contains user object" '"user"' \
    -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@pinkcafe.com","password":"pinkcafe2025"}'

# ---------------------------------------------------------------------------
# Prophet presets
# ---------------------------------------------------------------------------
expect_status "GET /api/prophet/presets → 200" 200 \
    "$BASE_URL/api/prophet/presets"

expect_body "Presets response contains Default preset" "Default" \
    "$BASE_URL/api/prophet/presets"

expect_status "GET /api/prophet/presets/Default → 200" 200 \
    "$BASE_URL/api/prophet/presets/Default"

expect_status "GET /api/prophet/presets/NonExistent → 404" 404 \
    "$BASE_URL/api/prophet/presets/NonExistent"

expect_status "GET /api/prophet/active-preset → 200" 200 \
    "$BASE_URL/api/prophet/active-preset"

# Create / delete a temporary preset
expect_status "POST /api/prophet/presets — create SmokeTest preset → 201" 201 \
    -X POST "$BASE_URL/api/prophet/presets" \
    -H "Content-Type: application/json" \
    -d '{"preset_name":"SmokeTest"}'

expect_status "DELETE /api/prophet/presets/SmokeTest → 200" 200 \
    -X DELETE "$BASE_URL/api/prophet/presets/SmokeTest"

# Deleting 'Default' must be forbidden
expect_status "DELETE /api/prophet/presets/Default → 400 (protected)" 400 \
    -X DELETE "$BASE_URL/api/prophet/presets/Default"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "-------------------------------------------"
TOTAL=$((PASS + FAIL))
echo "Results: ${PASS}/${TOTAL} passed"
if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}${FAIL} test(s) failed${RESET}"
    exit 1
fi
echo -e "${GREEN}All tests passed${RESET}"
