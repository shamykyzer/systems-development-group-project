# Test Plan

> **Bristol-Pink Bakery Sales Prediction System**
> Last executed: February 25, 2026

---

## Overview

This document records all structured test cases executed against the Bristol-Pink sales forecasting application, covering functional behaviour, security controls, API correctness, and integration between the frontend, backend, and AI model.

**Pass target:** ≥ 95% of test cases pass with no critical defects at final release.

All API tests were executed against a live Docker-hosted backend instance (`http://127.0.0.1:5001`) using the sample datasets in `src/backend/CSV_Files/`.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ **Pass** | Test executed and passed with expected outcome |
| ⚠️ **Conditional Pass** | Test passed only after a corrective action was applied |
| ❌ **Fail** | Test failed; defect is open |
| 🔄 **In Progress** | Feature under active development; test cannot yet be fully evaluated |

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

These tests verify that the application's security controls function as specified and that sensitive data is handled correctly.

| ID | Feature Under Test | Input / Action | Expected Outcome | Actual Outcome | Corrective Action Taken | Result After Fix | Further Dev Required | Status |
|----|--------------------|---------------|-----------------|---------------|------------------------|-----------------|----------------------|--------|
| S-01 | Password hashing and encryption at rest | Register a new user; inspect the `users` table in the SQLite database | The stored password is a bcrypt hash — unreadable as plain text | Password correctly hashed using bcrypt and stored in the database | N/A | N/A | No | ✅ Pass |
| S-02 | API route protection — unauthenticated access | Send a `GET /api/v1/datasets` request with no session token or authentication header | Request should be rejected — return `401 Unauthorized` | Request succeeds and returns full dataset list — no authentication is required to call API endpoints | N/A | N/A | Yes — JWT or session token auth on protected endpoints | ❌ Fail |
| S-03 | Frontend route protection — unauthenticated navigation | Directly enter the URL of a protected page (e.g. `/home`) in the browser without logging in | Application redirects to the login page and prevents access to protected content | Redirect is not fully implemented — protected pages can be accessed directly via URL without logging in | N/A | N/A | Yes — frontend route guard implementation | 🔄 In Progress |
| S-04 | Session management — persistence across refresh | Log in successfully; refresh the browser; close and reopen the browser tab | User session does not persist — user is returned to the login page after refresh (unless persistent sessions are added later) | Session correctly does not persist — user is taken back to the login page on refresh | N/A | N/A | Yes — if persistent sessions / cookies are implemented later | ✅ Pass |
| S-05 | Generic error messages on invalid login | Submit incorrect credentials on the login form | Application displays `"Invalid email or password"` — the message must NOT indicate whether the email or the password was incorrect specifically | Application correctly returns the generic message `"Invalid email or password"` | N/A | N/A | No | ✅ Pass |
| S-06 | Duplicate account registration prevention | Attempt to register an account with a username or email that already exists in the database | Application returns an error — `"Username or email already exists"` | Correct error returned: `"Username or email already exists"` with `success: false` | N/A | N/A | No | ✅ Pass |

---

## Section 3 — API & Integration Tests

These tests were executed directly against the live Docker backend at `http://127.0.0.1:5001` using PowerShell `Invoke-RestMethod`. All tests marked Pass were confirmed on **25 February 2026**.

### 3.1 — Health & Status

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-01 | `/api` | GET | None | `{ "status": "running", "message": "Pink Cafe Backend API" }` | `status: running` — returned correctly | ✅ Pass |

### 3.2 — Authentication

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-02 | `/api/v1/auth/register` | POST | `{ username, email, password }` — new valid user | `success: true` | User created successfully | ✅ Pass |
| A-03 | `/api/v1/auth/register` | POST | Duplicate email already in database | `success: false` — `"Username or email already exists"` | Correct error returned | ✅ Pass |
| A-04 | `/api/v1/auth/login` | POST | Valid email and password | `{ success: true, user: { id, username, email } }` | `"Login successful"` with user object returned | ✅ Pass |
| A-05 | `/api/v1/auth/login` | POST | Incorrect password | `success: false` — generic error message | `"Invalid email or password"` — generic message confirmed | ✅ Pass |

### 3.3 — Dataset Upload & Management

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-06 | `/api/v1/datasets` | POST | Valid coffee CSV via multipart form (`name=test-upload`, `category=coffee`) | Dataset created; items extracted; row count returned | `dataset.id=12`, `inserted_sales_rows=460`, items `[Cappuccino, Americano]` | ✅ Pass |
| A-07 | `/api/v1/datasets` | GET | None | List of all ingested datasets with IDs, filenames, and timestamps | Full dataset list returned correctly (12 datasets) | ✅ Pass |
| A-08 | `/api/v1/items?dataset_id=1` | GET | `dataset_id=1` | List of items belonging to that dataset | `[{ id:1, name:Cappuccino, category:coffee }, { id:2, name:Americano, category:coffee }]` | ✅ Pass |

### 3.4 — Analytics

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-09 | `/api/v1/analytics/top-sellers` | GET | `dataset_id=1, category=coffee, weeks=4, limit=3` | Top N items ranked by total sales in window, with totals and date range | Americano: 2850 units, Cappuccino: 2654 units — window 19 Sep to 16 Oct 2025 | ✅ Pass |
| A-10 | `/api/v1/analytics/fluctuation` | GET | `dataset_id=1, item_id=1, weeks=4` | Daily sales series for the specified item over the window | 28-day series returned for Cappuccino (19 Sep – 16 Oct 2025), values range 69–111 | ✅ Pass |
| A-11 | `/api/v1/analytics/top-sellers` | GET | Missing `dataset_id` | `success: false` — `"dataset_id is required"` | Correct validation error returned | ✅ Pass |

### 3.5 — Forecasting

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-12 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=4` | 28 forecast points (4-week horizon); `model_run_id` returned | `model_run_id=3`, 28 points — ✅ | ✅ Pass |
| A-13 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=6` | 28 forecast points using 6-week training window | `model_run_id=1`, 28 points — ✅ | ✅ Pass |
| A-14 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=prophet, train_weeks=8` | 28 forecast points using 8-week training window | `model_run_id=4`, 28 points — ✅; output visibly differs from 4-week window | ✅ Pass |
| A-15 | `/api/v1/forecast` | GET | `dataset_id=1, item_id=1, algorithm=baseline, train_weeks=4` | 28 forecast points from the baseline seasonal naïve model | `model_run_id=2`, 28 points returned from `baseline_seasonal_naive_7` | ✅ Pass |
| A-16 | `/api/v1/forecast/zoom` | GET | `model_run_id=1, start=2025-10-17, end=2025-10-31` | Subset of the forecast within the specified date range | 15 data points returned (17 Oct – 31 Oct) | ✅ Pass |
| A-17 | `/api/v1/forecast` | GET | `dataset_id=9999` (non-existent) | `success: false` — descriptive error message | `"dataset has no sales data"` — correct error returned | ✅ Pass |

### 3.6 — Model Evaluation

| ID | Endpoint | Method | Test Input | Expected Response | Actual Response | Status |
|----|----------|--------|-----------|------------------|-----------------|--------|
| A-18 | `/api/v1/evaluation/run` | POST | `{ dataset_id:1, item_id:1, train_weeks:6, eval_weeks:2 }` | Evaluation run created; MAE, MAPE, RMSE returned per item | Americano — MAE: 17.79, RMSE: 19.10, MAPE: 17.11%; Cappuccino — MAE: 31.79, RMSE: 34.20, MAPE: 32.30% | ✅ Pass |
| A-19 | `/api/v1/evaluation/results?run_id=2` | GET | `run_id=2` | Stored metrics retrieved with algorithm name and parameters | Full results returned for both items with correct algorithm label `baseline_seasonal_naive_7` | ✅ Pass |

---

## Section 4 — Performance & Stress Tests

| ID | Test | Method | Expected | Actual Result | Status |
|----|------|--------|---------|---------------|--------|
| P-01 | Prophet forecast response time — 4-week training | Timed single request `algorithm=prophet, train_weeks=4` | Completes within a reasonable timeframe suitable for interactive use | Completed in < 5 seconds | ✅ Pass |
| P-02 | Prophet forecast response time — 8-week training | Timed single request `algorithm=prophet, train_weeks=8` | Completes within a reasonable timeframe | Completed in < 8 seconds | ✅ Pass |
| P-03 | CSV upload — large dataset ingestion | Upload the full March–October 2025 coffee CSV (460 rows) | File parsed and ingested without timeout or data loss | 460 rows inserted successfully with no errors | ✅ Pass |
| P-04 | Analytics on multi-item dataset | `GET /api/v1/analytics/top-sellers` against dataset with multiple items | Response returns correctly within a reasonable time | Returned within < 1 second | ✅ Pass |

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

| Category | Total Tests | ✅ Pass | ⚠️ Conditional Pass | 🔄 In Progress / ❌ Fail |
|----------|------------|--------|---------------------|--------------------------|
| Functional & Usability | 10 | 7 | 2 | 1 |
| Security | 6 | 4 | 0 | 2 |
| API & Integration | 19 | 19 | 0 | 0 |
| Performance & Stress | 4 | 4 | 0 | 0 |
| UI / Accessibility | 4 | 3 | 0 | 1 |
| **Total** | **43** | **37** | **2** | **4** |

**Pass rate (Pass + Conditional Pass): 91%** — targeting ≥ 95% by April 2026.

---

## Open Defects

| Ref | Description | Severity | Category | Linked Test | Target Resolution |
|-----|-------------|----------|----------|-------------|-------------------|
| DEF-01 | Navbar toggle does not function correctly on desktop-width viewports | Minor | UI | F-05, U-02 | April 2026 |
| DEF-02 | API endpoints return data without any authentication token — route protection not implemented on the backend | Medium | Security | S-02 | April 2026 |
| DEF-03 | Frontend does not enforce route guards — authenticated pages accessible directly via URL without logging in | Medium | Security | S-03 | April 2026 |
