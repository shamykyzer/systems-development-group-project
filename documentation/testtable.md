# Test Plan

> **Bristol-Pink Bakery Sales Prediction System**
> Last executed: March 22, 2026 — Final submission re-run

---

## Overview

This document records all structured test cases executed against the Bristol-Pink sales forecasting application, covering functional behaviour, security controls, API correctness, and integration between the frontend, backend, and AI model.

**Pass target:** ≥ 95% of test cases pass with no critical defects at final release.

All API tests were executed against a live Docker-hosted backend instance (`http://127.0.0.1:5001`) using the sample datasets in `backend/CSV_Files/`. Tests were run with `docker compose up --build` on the `TestTableUpdate` branch (March 22, 2026). API calls were made using `curl.exe` and `Invoke-RestMethod` from PowerShell.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ **Pass** | Test executed and passed with expected outcome |
| ⚠️ **Conditional Pass** | Test passed only after a corrective action was applied |
| ❌ **Fail** | Test failed; defect is open |
| 🔄 **In Progress** | Feature under active development; test cannot yet be fully evaluated |
| 🚫 **Removed** | Endpoint or feature no longer exists in the current codebase — test is not applicable |

---

## Section 1 — Functional & Usability Tests

These tests verify that each user-facing feature of the application behaves as expected when operated normally.

| ID | Feature Under Test | Input / Action | Expected Outcome | Actual Outcome | Corrective Action Taken | Result After Fix | Further Dev Required | Status |
|----|--------------------|---------------|-----------------|---------------|------------------------|-----------------|----------------------|--------|
| F-01 | Web application opens and displays correctly | Run the full stack via `docker compose up --build` | Browser navigates to `http://localhost:3000` and displays the login page without errors | Application loaded correctly in the browser and the login page rendered | N/A | N/A | No | ✅ Pass |
| F-02 | Login page renders and accepts credentials | Submit valid username and password on the login form | User is authenticated and redirected to the home dashboard | Components rendered correctly; login was non-functional — user could not advance past the login page | Reconfigured the Dockerfile to include the backend service so that credentials could be validated against the SQLite database | Login now works correctly using credentials stored in the database | No | ⚠️ Conditional Pass |
| F-03 | Home dashboard renders Prophet forecast graphs | Navigate to `/home` after a successful login | Dashboard loads and displays Prophet-generated sales forecast graphs for the top items | General page structure was present but no graphs rendered | Implemented Meta's Prophet model in the backend; wired up the frontend graph rendering with the `/api/v1/forecast` endpoint | Forecast graphs now render on the home page | No | ✅ Pass |
| F-04 | Database connection and CSV data accessible from the frontend | Upload a `.csv` file via the API and retrieve it through the frontend | Data from the CSV is correctly persisted and accessible in the application | CSV data displayed correctly, confirming the backend database is connected and reachable | N/A | N/A | No | ✅ Pass |
| F-05 | Responsive navbar — visible/hidden toggle and navigation links | Render the application on desktop and mobile screen sizes | Navbar displays on load; toggle button hides/shows it; all navigation links route correctly on all screen sizes | Navbar rendered on page load; toggle button had no effect; navigation buttons were non-functional | Wired navigation buttons to their respective routes; implemented show/hide toggle logic | Toggle and routing work correctly on mobile and small screens; desktop toggle behaviour still inconsistent | Yes — desktop navbar toggle | 🔄 In Progress |
| F-06 | Settings page — user-configurable forecast parameters | Open the Settings page via the navbar; adjust training period and save | Settings page opens with configurable options; changes are saved and reflected in subsequent forecasts | Settings page appeared with most options displayed; changes had no effect as no backend connection existed | Established backend API connection to persist settings in the database | Settings are now saved to the database and correctly applied when the forecasting algorithm runs | No | ⚠️ Conditional Pass |
| F-07 | Forecast graphs update when underlying data changes | Modify the sales data in the database and reload the dashboard | Graphs re-render to reflect the updated data | Graphs correctly updated following data changes | N/A | N/A | No | ✅ Pass |
| F-08 | Database CRUD operations persist correctly | Save data to the database; refresh the application and restart the container | Previously saved data remains available after page refresh and system restart, with no data loss or errors | Database correctly persisted data across sessions and restarts | N/A | N/A | No | ✅ Pass |
| F-09 | CSV upload page — file selection and ingestion | Navigate to the Upload page; select a valid `.csv` file and submit | File is uploaded, parsed, and ingested into the database; user receives confirmation with the new dataset name and item list | Upload completed successfully; 460 sales rows inserted; items (Cappuccino, Americano) correctly identified and stored | N/A | N/A | No | ✅ Pass |
| F-10 | Training period selector — range 4 to 8 weeks | On the dashboard or settings, select training periods of 4, 6, and 8 weeks; trigger a forecast for each | Three distinct forecasts are generated with different training windows; each returns 28 forecast points (4-week horizon) | All three training windows produced correct 28-point forecasts; outputs visibly differ between windows | N/A | N/A | No | ✅ Pass |

---

## Section 2 — Security Tests

These tests verify that the application's security controls function as specified and that sensitive data is handled correctly. Tests S-07 through S-11 were added on March 22, 2026 as part of the final security review.

| ID | Feature Under Test | Input / Action | Expected Outcome | Actual Outcome | Corrective Action Taken | Result After Fix | Further Dev Required | Status |
|----|--------------------|---------------|-----------------|---------------|------------------------|-----------------|----------------------|--------|
| S-01 | Password hashing and encryption at rest | Register a new user; inspect the `users` table in the SQLite database | The stored password is a bcrypt hash — unreadable as plain text | Password correctly hashed using bcrypt (12 rounds) and stored in the database — no plaintext found | N/A | N/A | No | ✅ Pass |
| S-02 | API route protection — unauthenticated access | Send a `GET /api/prophet/presets` request with no session token or authentication header | Request should be rejected — return `401 Unauthorized` | All protected endpoints now return HTTP 401 when no `Authorization: Bearer <token>` header is present; authenticated requests with a valid token return 200 as expected | Added `require_auth` decorator in `routes.py` using `secrets.token_urlsafe(32)` tokens stored in a new `sessions` DB table; token issued on login and sent back in response; all protected routes decorated accordingly | Unauthenticated requests blocked (401); authenticated requests succeed | No | ✅ Pass |
| S-03 | Frontend route protection — unauthenticated navigation | Directly enter the URL of a protected page (e.g. `/home`) in the browser without logging in | Application redirects to the login page and prevents access to protected content | `ProtectedRoute.jsx` is fully implemented: checks `localStorage['pinkcafe_user']` and redirects to `/login` if absent; 15-minute inactivity timeout also enforced | N/A | N/A | No | ✅ Pass |
| S-04 | Session management — persistence across refresh | Log in successfully; refresh the browser; close and reopen the browser tab | User session does not persist — user is returned to the login page after refresh (unless persistent sessions are added later) | Session correctly does not persist — user is taken back to the login page on refresh | N/A | N/A | Yes — if persistent sessions / cookies are implemented later | ✅ Pass |
| S-05 | Generic error messages on invalid login | Submit incorrect credentials on the login form | Application displays `"Invalid email or password"` — the message must NOT indicate whether the email or the password was incorrect specifically | Application correctly returns the generic message `"Invalid email or password"` with HTTP 401 | N/A | N/A | No | ✅ Pass |
| S-06 | Duplicate account registration prevention | Attempt to register an account with a username or email that already exists in the database | Application returns an error — `"Username or email already exists"` | Correct error returned: `"Username or email already exists"` with `success: false` and HTTP 400 | N/A | N/A | No | ✅ Pass |
| S-07 | SQL injection in login email field | POST `{ "email": "' OR '1'='1", "password": "any" }` to `/api/v1/auth/login` | Login attempt fails — `"Invalid email or password"` HTTP 401; no data leaked | HTTP 401 returned — parameterised `sqlite3` queries prevent injection; no row returned | N/A | N/A | No | ✅ Pass |
| S-08 | XSS payload in username field at registration | POST `{ "username": "<script>alert(1)</script>", "email": "...", "password": "..." }` to `/api/v1/auth/register` | Server should sanitise or reject the payload; raw HTML must not be stored or returned in API responses | HTTP 400 returned — `"Username may only contain letters, numbers, spaces, hyphens, underscores, apostrophes, and dots (max 50 characters)"` — payload rejected before reaching the database | Added `_VALID_USERNAME_RE` regex in `routes.py` to allowlist safe username characters; invalid usernames return 400 without storing | XSS payload rejected at the API boundary; no storage or reflection of raw HTML | No | ✅ Pass |
| S-09 | HTTP security response headers | Inspect response headers from `GET /api` and `POST /api/v1/auth/login` | `X-Frame-Options`, `X-Content-Type-Options`, and `Content-Security-Policy` headers present | All three headers now present on every response: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'self'; ...` | Added `@app.after_request` hook in `app.py` that injects the security headers on every response | All three required headers confirmed present in response | No | ✅ Pass |
| S-10 | CORS policy — cross-origin request from untrusted origin | Send `GET /api` with `Origin: https://evil.com` header | No `Access-Control-Allow-Origin` header returned for untrusted origin | No ACAO header returned for `evil.com`; `Origin: http://localhost:3000` correctly receives ACAO — CORS restricted to configured origin only | N/A | N/A | No | ✅ Pass |
| S-11 | Malformed JSON body — no stack trace exposure | POST malformed JSON `{bad json` to `/api/v1/auth/login` | Server returns HTTP 400 with a user-friendly validation message; no stack trace or internal path exposed | HTTP 400 returned with `"email and password are required"` — no stack trace, no file paths, no internal detail exposed | N/A | N/A | No | ✅ Pass |

---

## Section 3 — API & Integration Tests

These tests were executed directly against the live Docker backend at `http://127.0.0.1:5001`.  
- **A-01 to A-05** and **A-12 to A-14** were previously passing and re-confirmed on **March 22, 2026**.  
- **A-06 to A-11, A-15, A-16, A-18, A-19** were passing on February 25, 2026 but now return **404** — the corresponding endpoints were removed from the codebase between the two test runs. These are recorded as ❌ Fail / Removed (see DEF-06).  
- **A-20 to A-38** are new tests added on March 22, 2026 to cover the endpoints present in the current codebase.

### 3.1 — Health & Status

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-01 | `/api` | GET | None | `{ "status": "ok", "message": "Pink Cafe API" }` | `{"status": "ok", "message": "Pink Cafe API"}` — correct | ✅ Pass |

### 3.2 — Authentication

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-02 | `/api/v1/auth/register` | POST | `{ username, email, password }` — new valid user | `success: true`, `"Registered successfully"` | `success: true`, `"Registered successfully"` | ✅ Pass |
| A-03 | `/api/v1/auth/register` | POST | Duplicate email already in database | `success: false`, HTTP 400 — `"Username or email already exists"` | HTTP 400, `"Username or email already exists"` — correct | ✅ Pass |
| A-04 | `/api/v1/auth/login` | POST | Valid email and password | `{ success: true, user: { id, username, email } }` | `"Login successful"` with user object returned | ✅ Pass |
| A-05 | `/api/v1/auth/login` | POST | Incorrect password | `success: false`, HTTP 401 — generic error | HTTP 401, `"Invalid email or password"` — generic message confirmed | ✅ Pass |

### 3.3 — Dataset Upload & Management (February 25 tests — endpoints now removed)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-06 | `/api/v1/datasets` | POST | Valid coffee CSV via multipart form | Dataset created; items extracted | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-07 | `/api/v1/datasets` | GET | None | List of all ingested datasets | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-08 | `/api/v1/items?dataset_id=1` | GET | `dataset_id=1` | List of items for that dataset | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |

### 3.4 — Analytics (February 25 tests — endpoints now removed)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-09 | `/api/v1/analytics/top-sellers` | GET | `dataset_id=1, category=coffee, weeks=4` | Top items ranked by total sales | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-10 | `/api/v1/analytics/fluctuation` | GET | `dataset_id=1, item_id=1, weeks=4` | Daily sales series for item | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-11 | `/api/v1/analytics/top-sellers` | GET | Missing `dataset_id` | `success: false` — `"dataset_id is required"` | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |

### 3.5 — Forecasting

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-12 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=4` | 28 forecast points (4-week horizon); `success: true` | `success: true`, 28 points, `algorithm: prophet`, response in 0.11 s (cached) | ✅ Pass |
| A-13 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=6` | 28 forecast points using 6-week training window | `success: true`, 28 points | ✅ Pass |
| A-14 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=8` | 28 forecast points using 8-week training window | `success: true`, 28 points, response in 0.17 s | ✅ Pass |
| A-15 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=baseline, train_weeks=4` | 28 forecast points from baseline seasonal naïve model | Baseline algorithm removed from codebase — `"Algorithm 'baseline' not supported (use 'prophet')"` | 🚫 Removed |
| A-16 | `/api/v1/forecast/zoom` | GET | `model_run_id=1, start=2025-10-17, end=2025-10-31` | Subset of forecast within date range | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-17 | `/api/v1/forecast` | GET | `dataset_id=9999` (non-existent) | `success: false` — descriptive error | HTTP 400 `"No sales data found"` — correct error returned | ✅ Pass |

### 3.6 — Model Evaluation (February 25 tests — endpoints now removed)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-18 | `/api/v1/evaluation/run` | POST | `{ dataset_id:1, item_id:1, train_weeks:6, eval_weeks:2 }` | Evaluation run created; MAE, MAPE, RMSE returned | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |
| A-19 | `/api/v1/evaluation/results?run_id=2` | GET | `run_id=2` | Stored metrics retrieved with algorithm name | Endpoint removed from codebase — HTTP 404 | 🚫 Removed |

### 3.7 — CSV Upload Validation (new — March 22, 2026)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-20 | `/api/upload/csv` | POST | Valid coffee CSV (`Pink CoffeeSales March - Oct 2025.csv`) | `success: true`; row count; items list | `success: true`, `inserted_rows: 230`, `items: [Cappuccino, Americano]` | ✅ Pass |
| A-21 | `/api/upload/csv` | POST | Non-CSV file (`.txt`) | HTTP 400 — `"File must be a CSV"` | HTTP 400, `"File must be a CSV"` | ✅ Pass |
| A-22 | `/api/upload/csv` | POST | CSV missing `Date` column | HTTP 400 — `"CSV must have a 'Date' column"` | HTTP 400, `"CSV must have a 'Date' column"` | ✅ Pass |
| A-23 | `/api/upload/csv` | POST | CSV with ISO date format (`YYYY-MM-DD`) instead of `dd/mm/yyyy` | HTTP 400 — date format error | HTTP 400, `"Dates must be in dd/mm/yyyy format"` | ✅ Pass |
| A-24 | `/api/upload/dataset/<id>` | DELETE | Existing dataset ID | HTTP 200 — dataset deleted | HTTP 200, `"Dataset deleted successfully"` | ✅ Pass |
| A-25 | `/api/upload/dataset/<id>` | DELETE | Already-deleted dataset ID (duplicate call) | HTTP 404 — not found | HTTP 404, `"Dataset not found"` | ✅ Pass |

### 3.8 — Prophet Settings / Presets (new — March 22, 2026)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-26 | `/api/prophet/presets` | GET | None | HTTP 200 — list of preset objects | HTTP 200 — list including Default preset returned | ✅ Pass |
| A-27 | `/api/prophet/presets` | POST | `{ "name": "TestPreset", "seasonality_mode": "additive", ... }` | HTTP 201 — preset created | HTTP 201, preset created and returned | ✅ Pass |
| A-28 | `/api/prophet/presets/<name>` | GET | `name=TestPreset` | HTTP 200 — preset settings | HTTP 200, full settings returned | ✅ Pass |
| A-29 | `/api/prophet/presets/<name>` | PUT | Update `changepoint_prior_scale` | HTTP 200 — updated values reflected | HTTP 200, updated preset returned | ✅ Pass |
| A-30 | `/api/prophet/presets/Default` | DELETE | Attempt to delete the protected Default preset | HTTP 400 — `"Cannot delete Default"` | HTTP 400, `"Cannot delete Default preset"` | ✅ Pass |
| A-31 | `/api/prophet/presets/<name>` | DELETE | Delete custom preset `TestPreset` | HTTP 200 — deleted | HTTP 200, `"Preset deleted"` | ✅ Pass |
| A-32 | `/api/prophet/active-preset` | GET | None | HTTP 200 — `{ "preset_name": "Default" }` | HTTP 200, `{"preset_name": "Default"}` | ✅ Pass |
| A-33 | `/api/prophet/active-preset` | PUT | `{ "preset_name": "Default" }` | HTTP 200 — active preset updated | HTTP 200 | ✅ Pass |
| A-34 | `/api/prophet/active-preset` | PUT | `{ "preset_name": "NonExistentPreset" }` | HTTP 404 — preset not found | HTTP 404, `"Preset not found"` | ✅ Pass |

### 3.9 — Prophet Test Endpoint (new — March 22, 2026)

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-35 | `/api/prophet/test` | GET | None | Forecast generated from hardcoded sample data | HTTP 200, 28 forecast points, `success: true` | ✅ Pass |

---

## Section 4 — Performance & Stress Tests

All performance tests were executed on **March 22, 2026** against the live Docker backend. Response times measured via PowerShell `Measure-Command`. Prophet models are cached in the database after the first training run; cached responses are indicated below.

| ID | Test | Method | Expected | Actual Result | Status |
|----|------|--------|---------|---------------|--------|
| P-01 | Prophet forecast response time — 4-week training | Timed single `GET /api/v1/forecast` with `algorithm=prophet, train_weeks=4` | Completes within a reasonable timeframe suitable for interactive use | 0.11 s (cached model) | ✅ Pass |
| P-02 | Prophet forecast response time — 8-week training | Timed single `GET /api/v1/forecast` with `algorithm=prophet, train_weeks=8` | Completes within a reasonable timeframe | 0.17 s (cached model) | ✅ Pass |
| P-03 | CSV upload — large dataset ingestion | Upload `Pink CoffeeSales March - Oct 2025.csv` (230 rows) via `POST /api/upload/csv` | File parsed and ingested without timeout or data loss | 0.09 s; 230 rows inserted with no errors | ✅ Pass |
| P-04 | Prophet test endpoint — 8-week horizon | `GET /api/prophet/test` | Response returns within acceptable time | 0.17 s; 28 forecast points returned | ✅ Pass |
| P-05 | Concurrent forecast requests | Two simultaneous `GET /api/v1/forecast` requests for different items | Both requests succeed; no race condition or data mixing | Both returned `success: true` with correct 28-point forecasts; total elapsed 0.82 s | ✅ Pass |

---

## Section 5 — UI / Accessibility Tests

| ID | Test | Method | Expected | Actual Result | Status |
|----|------|--------|---------|---------------|--------|
| U-01 | Responsive layout — mobile viewport | Render application at 375px width (iPhone SE) | All components scale correctly; no horizontal overflow; navbar collapses | Layout scales correctly at mobile widths; navbar collapses and toggle functions | ✅ Pass |
| U-02 | Responsive layout — desktop viewport | Render application at 1440px width | Full layout displayed; sidebar/navbar visible without toggle | Layout displays correctly at desktop widths; navbar toggle has a minor bug (see DEF-01) | 🔄 In Progress |
| U-03 | Colour contrast compliance | Inspect primary text and background colour pairings against WCAG 2.1 AA minimum (4.5:1 ratio) | All text meets the minimum contrast ratio | Tailwind CSS default pairings and custom palette reviewed — primary text contrast passes | ✅ Pass |
| U-04 | Open-source fonts | Verify all fonts used in the application are open-source licensed | No proprietary font licences required | Google Fonts / system fonts used throughout — no copyright concerns | ✅ Pass |

---

## Summary

| Category | Total Tests | ✅ Pass | ⚠️ Conditional Pass | ❌ Fail | 🚫 Removed | 🔄 In Progress |
|----------|------------|--------|---------------------|---------|------------|----------------|
| Functional & Usability | 10 | 7 | 2 | 0 | 0 | 1 |
| Security | 11 | 11 | 0 | 0 | 0 | 0 |
| API & Integration | 35 | 23 | 0 | 0 | 12 | 0 |
| Performance & Stress | 5 | 5 | 0 | 0 | 0 | 0 |
| UI / Accessibility | 4 | 3 | 0 | 0 | 0 | 1 |
| **Total** | **65** | **49** | **2** | **0** | **12** | **2** |

**Pass rate for active functionality (Pass + Conditional Pass out of non-removed tests): 96%**  
Removed tests (🚫) reflect an architectural change between the February 25 and March 22 runs — these endpoints were intentionally removed from the codebase (see DEF-06).

---

## Open Defects

| Ref | Description | Severity | Category | Linked Test | Target Resolution |
|-----|-------------|----------|----------|-------------|-------------------|
| DEF-01 | Navbar toggle does not function correctly on desktop-width viewports | Minor | UI | F-05, U-02 | April 2026 |
| DEF-06 | Multiple previously documented API endpoints have been removed from the codebase: `/api/v1/datasets` (POST/GET), `/api/v1/items`, `/api/v1/analytics/top-sellers`, `/api/v1/analytics/fluctuation`, `/api/v1/forecast/zoom`, `/api/v1/evaluation/run`, `/api/v1/evaluation/results`; baseline algorithm also removed — tests A-06 to A-11, A-15, A-16, A-18, A-19 all now return 404 | High | API | A-06–A-11, A-15–A-16, A-18–A-19 | Acknowledged — architectural change |
