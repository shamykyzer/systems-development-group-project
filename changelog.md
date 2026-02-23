# Changelog

---

## Format Guide

When adding changes, use this format:

```
## [Version or Unreleased] - YYYY-MM-DD

- **Type:** Short description of what changed
```

**Types:** `Added` | `Changed` | `Fixed` | `Removed` | `Deprecated` | `Security`

**Rules:**
- One bullet per change
- Start with the type in bold, then a colon
- Use past tense (e.g. "Fixed login bug" not "Fix login bug")
- Keep descriptions short and clear

**Example:**
```markdown
## [Unreleased]

- **Added:** CSV upload validation for date columns
- **Fixed:** Login form handling of network errors
- **Changed:** Moved frontend from pinkcafe/ to src/frontend/
```

---

## [Unreleased]

- **Changed:** Project structure – `pinkcafe/` renamed to `src/frontend/`
- **Removed:** Redundant `pinkcafe/backend/` folder
- **Changed:** Updated Dockerfile, docker-compose, and workflows for new paths
- **Changed:** Moved all test scripts from `src/backend/tests/` to root `tests/` directory

---

## [0.1.0] - 2025-02-23

- **Added:** Flask backend with app factory and blueprints
- **Added:** React frontend with Tailwind CSS
- **Added:** CSV ingestion API and SQLite schema
- **Added:** Analytics API (top sellers, fluctuation series)
- **Added:** Prophet and baseline forecasting
- **Added:** Evaluation API for model backtesting
- **Added:** Auth with bcrypt (register/login)
- **Added:** Docker Compose for backend and frontend
- **Added:** Production image (Gunicorn + static frontend)
