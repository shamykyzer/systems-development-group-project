<div align="center">

# Bristol-Pink Cafe
## AI-Powered Sales Forecasting System

**Systems Development Group Project** | University of the West of England | 2025–2026

| Nickolas Greiner | Aaron Agoas Antal-Bento | Oliver Mercer | Oliver Churchley | Ahmed Desoky AlShamy |
|:---:|:---:|:---:|:---:|:---:|
| 24018357 | 23013693 | 24026901 | 23020494 | 24045361 |

</div>

---

<br>

## 1. The Problem

Bristol-Pink is a five-location bakery café chain. Café managers must decide every morning how much to produce — croissants, cappuccinos, americanos — with no system to support that decision.

> **Result:** over-ordering perishables, avoidable food waste, and consistent financial loss with no way to improve without data.

The business had the data. It just had no way to use it.

<br>

---

## 2. Our Solution

We built a **full-stack web application** that turns historical sales CSVs into actionable 4-week demand forecasts — driven by Meta's Prophet AI model and presented through a clean, accessible dashboard.

**Core capabilities delivered:**

| Capability | Detail |
|---|---|
| **Sales Forecasting** | Meta's Prophet generates a 4-week demand forecast per item |
| **Top Sellers** | Automatically surfaces the top 3 food and coffee items |
| **Historical Analysis** | Daily fluctuation charts over any configurable window |
| **Training Control** | User-adjustable training period — 4 to 8 weeks |
| **CSV Ingestion** | Upload any wide-format sales CSV; auto-detects items |
| **Model Evaluation** | MAE, RMSE, MAPE backtesting against held-out data |
| **Secure Access** | Login system with bcrypt password hashing |

<br>

---

## 3. Project Aim

> *To design and implement a web-based graphical application integrating a machine learning-driven sales forecasting system using Meta's Prophet for five cafés — generating short-term demand predictions for food and beverage items to optimise purchasing decisions, reduce food waste, and minimise financial loss.*

<br>

---

## 4. S.M.A.R.T. Objectives

> Objectives are oriented around **system deliverables** — each is specific, measurable, and tied to a concrete outcome.

| # | Objective | Measured By | Target Date |
|---|-----------|-------------|-------------|
| **O1** | Deliver a working web application with a dashboard, sales history, and parameter controls | MVP accepted in internal team review | March 2026 |
| **O2** | Implement a Prophet AI model achieving **≥ 85% forecast accuracy** on held-out sales data | Backtested MAE / MAPE against historical data | April 2026 |
| **O3** | Deploy an interactive dashboard fully compliant with **WCAG 2.1 AA** accessibility standards | Contrast ratio, font size, and keyboard navigation audit | April 2026 |
| **O4** | Complete structured testing ensuring **≥ 95% of test cases pass** with no critical defects | Pass rate recorded in the live test plan | April 2026 |
| **O5** | Produce clean, documented code with enforced version control — all PRs reviewed by **≥ 2 members** | GitHub branch protection rules enforced throughout | April 2026 |

<br>

---

## 5. Requirements

### Functional Requirements
> *What the system does — prioritised using MoSCoW*

| ID | Priority | The system shall… |
|----|----------|-------------------|
| FR-01 | **Must** | Authenticate users via a secure login page before granting access to any data |
| FR-02 | **Must** | Accept CSV sales data uploads and ingest them into a normalised relational schema |
| FR-03 | **Must** | Generate per-item 28-day sales forecasts using Meta's Prophet time-series model |
| FR-04 | **Must** | Display historical sales data and forward predictions as interactive charts |
| FR-05 | **Should** | Allow users to configure the training window (4–8 weeks) and compare forecast outputs across windows |
| FR-06 | **Should** | Automatically identify and surface the top 3 best-selling food and coffee items |
| FR-07 | **Could** | Persist user forecast preferences across sessions via a settings page |
| FR-08 | **Could** | Expose a versioned REST API for auth, data management, analytics, forecasting, and evaluation |

### Non-Functional Requirements
> *How well the system performs — each criterion is measurable and testable*

| ID | Quality Attribute | The system shall… |
|----|------------------|-------------------|
| NFR-01 | **Accessibility** | Comply with WCAG 2.1 AA — minimum 4.5:1 colour contrast ratio, scalable fonts, full keyboard navigation |
| NFR-02 | **Usability** | Render without layout breakage at 375 px, 768 px, and 1280 px viewport widths |
| NFR-03 | **Performance** | Return a completed forecast response within 15 seconds for datasets of up to 500 rows |
| NFR-04 | **Security** | Store all passwords as bcrypt hashes (cost ≥ 12); return only generic error messages on auth failure to prevent credential enumeration |
| NFR-05 | **Reliability** | Achieve a ≥ 95% test case pass rate with zero critical-severity defects open at final release |
| NFR-06 | **Maintainability** | All non-trivial functions carry inline comments; every pull request requires ≥ 2 peer approvals before merge |
| NFR-07 | **Portability** | The full stack must start successfully with a single `docker compose up --build` command on any machine with Docker installed |

<br>

---

## 6. System Design

### Use Case Diagram

Two actors interact with the system — the **Café Manager** (day-to-day user) and the **Data Analyst** (data management) — with core use cases including importing CSVs, generating predictions, and viewing historical charts.

![Use Case Diagram](documentation/UseCaseDiagram.png)

<br>

### Class Diagram

The class diagram maps directly to the SQLite schema — eight tables covering users, datasets, sales records, forecast runs, and evaluation metrics, all linked via foreign keys with cascade deletes.

**Part 1 — Core entities: Users, Datasets, SalesRecords, ForecastRuns**

![Class Diagram Part 1](documentation/ClassDiagram1.png)

**Part 2 — Evaluation, Metrics, and supporting relationships**

![Class Diagram Part 2](documentation/ClassDiagram2.png)

<br>

### Sequence Diagrams

**Sequence 1 — Generate Prediction for Selected Date / Range**

Shows the message flow between the User, DashboardController, MLAlgorithm, and GraphRenderer — from requesting a prediction through to the chart being rendered.

![Sequence Diagram — Generate Prediction](documentation/SequenceDiagram1.png)

**Sequence 2 — Load CSV & Display Sales Graph**

Traces the full pipeline from a CSV upload through parsing and date-grouping to the sales graph being returned to the user.

![Sequence Diagram — Load CSV](documentation/SequenceDiagram2.png)

<br>

---

## 7. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React.js + Tailwind CSS + Recharts | Component-based; responsive layout utilities; Recharts for interactive, composable chart components |
| **Backend** | Python 3 + Flask | Lightweight REST API; best-in-class ML library ecosystem |
| **Database** | SQLite | Zero-configuration; embedded; well-suited to single-instance deployment |
| **AI / ML** | Meta's Prophet + Pandas + NumPy | Purpose-built additive time-series model; excels at weekly seasonality |
| **Deployment** | Docker + Docker Compose | Reproducible, one-command full-stack startup in any environment |
| **Version Control** | GitHub + GitHub Actions | Branching strategy, peer review enforcement, and automated CI/CD |

**The stack was selected to enable rapid development, modular design, and reproducible deployment.**

<br>

### System Architecture

```
 ┌──────────────────────────────────────────────────────────┐
 │                      Docker Compose                      │
 │                                                          │
 │   ┌─────────────────────┐   ┌──────────────────────────┐ │
 │   │  Frontend           │   │  Backend (Flask API)     │ │
 │   │  React + Tailwind   │◄──►  Python 3 + SQLite      │ │
 │   │  localhost:3000     │   │  localhost:5001          │ │
 │   └─────────────────────┘   └────────────┬─────────────┘ │
 │                                          │               │
 │                              ┌───────────▼─────────────┐ │
 │                              │  AI Forecasting Engine  │ │
 │                              │  Meta's Prophet         │ │
 │                              │  Pandas · NumPy         │ │
 │                              └─────────────────────────┘ │
 └──────────────────────────────────────────────────────────┘
```

The backend uses a **modular Flask blueprint architecture** — each concern (auth, datasets, analytics, forecasting, evaluation) is a self-contained blueprint, making the codebase maintainable and independently testable.

<br>

---

## 8. UI Design — Figma

Figma was used early in the project to explore and agree on the site's colour scheme and overall feel — giving the team a shared visual direction before any frontend code was written.

![Figma UI Designs](documentation/FigmaDesigns.png)

<br>

---

## 9. The AI Model — Meta's Prophet

### Why Prophet?

Meta's Prophet is an **additive decomposition model** specifically designed for business time-series data. Unlike a simple rolling average, it explicitly models:

- **Trend** — gradual growth or decline in sales over weeks
- **Weekly seasonality** — higher sales on weekends vs weekdays
- **Changepoints** — sudden shifts in trend (e.g. school holidays, promotions)

This makes it significantly more accurate than a naive baseline for café sales data.

### How it works in our system

```
CSV Upload
    │
    ▼
Normalise into sales table (date × item × quantity)
    │
    ▼
Train Prophet on (ds, y) pairs  ←  configurable train_weeks: 4–8
    │
    ▼
Generate 28-day forward forecast
    │
    ▼
Store in forecasts table  →  Return as JSON  →  Render on dashboard
```

### Measured Performance (live results, Feb 2026)

Evaluated against held-out data using the baseline seasonal naïve model (`baseline_seasonal_naive_7`):

| Item | MAE | RMSE | MAPE |
|------|-----|------|------|
| Americano | 17.79 units/day | 19.10 | 17.1% |
| Cappuccino | 31.79 units/day | 34.20 | 32.3% |

Prophet consistently outperformed the rolling average baseline on the same training windows.

| Algorithm | Description |
|-----------|-------------|
| `prophet` | Meta's Prophet — full additive decomposition (default) |
| `baseline` | Seasonal naïve rolling average — benchmark comparison |

<br>

---

## 10. Project Plan & Management

### Gantt Chart

The project ran from October 2025 to April 2026 across three parallel tracks: **Admin**, **Back End**, and **Front End**.

<details>
<summary><strong>📊 View Gantt Chart — click to expand</strong></summary>
<br>

> The chart is wide and detailed — two ways to read it properly:
>
> | Format | How to access |
> |--------|---------------|
> | 🔍 **Interactive** — zoom, pan, hover for labels | **[Open interactive Gantt →](documentation/gantt_chart.html)** |
> | 🖼️ **Full-size PNG** — right-click › Open in new tab | **[Open full-size image →](documentation/gantt_chart.png)** |

<br>

<a href="documentation/gantt_chart.png" title="Click to open full-size — then zoom natively in your browser">
  <img src="documentation/gantt_chart.png" alt="Project Gantt Chart — click to open full-size" width="100%">
</a>

</details>

**Admin track** *(project-wide overhead and documentation)*

| Task | Assigned To | Window |
|------|-------------|--------|
| Finish Front End Design Phase | Aaron, Nick, Shamyy | Oct – Nov 2025 |
| Project Plan | Oliver C, Oliver M | Dec 2025 – Jan 2026 |
| Risk Register | Oliver M, Aaron, Oliver C | Jan – Feb 2026 |
| Test Plan | Aaron, Nick, Oliver M | Feb 2026 |
| Report | Aaron, Nick, Oliver C, Oliver M | Mar – Apr 2026 |

**Back End track** *(Flask API, database, AI model)*

| Task | Assigned To | Window |
|------|-------------|--------|
| Login Form Functionality | Nick | Jan – Feb 2026 |
| Basic Database Implementation | Shamyy, Nick, Aaron | Jan – Feb 2026 |
| Implement Prophet MVP | Aaron, Oliver C, Nick, Shamyy | Jan – Mar 2026 |

**Front End track** *(React UI, Tailwind, page builds)*

| Task | Assigned To | Window |
|------|-------------|--------|
| Landing Page | Oliver M, Oliver C | Dec 2025 |
| Login Form | Nick, Oliver M, Oliver C | Dec 2025 – Feb 2026 |
| Add Favicon and Page Title | Oliver M | Jan – Feb 2026 |
| Create Upload Page for uploading CSV | Oliver M | Feb 2026 |
| Create a Settings Page for tweaking Prophet | Aaron | Feb 2026 |

The chart shows that **admin documentation ran as a continuous overhead across the whole project** while development tasks were time-boxed to specific sprints. The Prophet MVP has the longest back-end bar (Jan–Mar) reflecting its complexity. The Gantt was tracked live in a project management tool and updated as tasks shifted.

---

### Team Role Allocation

Task ownership was driven by each member's existing skill set, ensuring every part of the project was led by someone with relevant prior experience.

| Member | Role | Skill Justification |
|--------|------|---------------------|
| **Oliver M** | Frontend development, documentation lead | Prior React.js and Tailwind experience from Year 1 made him the natural pick for frontend builds. His previous role as a Case Manager at Howden Life & Health demanded rigorous documentation and compliance record-keeping — skills that carried directly into owning the test plan and risk register. |
| **Oliver C** | Frontend development, Prophet implementation | Comfortable across both frontend and analytical tasks, Oliver C moved from supporting page builds into leading the Prophet ML implementation — the most technically demanding part of the project. |
| **Nick** | Backend & database, login system | Prior experience with Python server-side logic and relational databases made him the right fit for the login system and core database implementation, where those skills had immediate impact. |
| **Aaron** | Full-stack, ML integration, settings | A broad technical profile spanning frontend, backend, and data meant Aaron was best placed to drive the Prophet MVP integration and build the settings page, where both Python and statistics knowledge were needed. |
| **Shamyy** | Backend, database design, ML | A strong mathematical and statistical background made Shamyy well-suited to time-series modelling, contributing to the Prophet implementation, database design, and the initial frontend design phase. |

### Version Control & CI/CD Pipeline

GitHub, GitHub Actions, and Docker operate together as an **integrated project management and quality assurance pipeline**:

```
Developer pushes feature branch
         │
         ▼
   GitHub Actions CI
   ─ Smoke tests run
   ─ Build verified
         │
    Pass │ Fail ── Merge blocked
         ▼
   Pull Request opened
   ─ Requires ≥ 2 approvals
         │
         ▼
   Merge to main
         │
         ▼
   Docker build verified
   Same image runs in dev, CI, and production
```

- **GitHub** enforces branch protection — no direct pushes to `main`
- **GitHub Actions** validates every PR automatically — broken code cannot reach the main branch
- **Docker** eliminates "works on my machine" — the tested image is exactly what runs in production

<br>

---

## 11. Testing & Quality Assurance

Full test plan → **[documentation/testtable.md](documentation/testtable.md)**

**43 test cases** executed against the live Docker backend on 25 February 2026.

### Results by Category

| Category | Total | Pass | Conditional Pass | In Progress / Fail |
|----------|-------|------|------------------|--------------------|
| Functional & Usability | 10 | 7 | 2 | 1 |
| Security | 6 | 4 | 0 | 2 |
| API & Integration | 19 | **19** | 0 | 0 |
| Performance & Stress | 4 | **4** | 0 | 0 |
| UI / Accessibility | 4 | 3 | 0 | 1 |
| **Total** | **43** | **37** | **2** | **4** |

**Pass rate (Pass + Conditional Pass): 91%** — target ≥ 95% by April 2026.

### API Test Highlights (all confirmed live)

| Test | Result |
|------|--------|
| CSV upload — 460 rows ingested correctly | ✅ |
| Prophet forecast — 28 points returned at 4, 6, and 8-week windows | ✅ |
| Forecast zoom — date range filter returns correct subset | ✅ |
| Top sellers — ranked correctly by volume | ✅ |
| Invalid credentials — returns only generic error (no enumeration) | ✅ |
| Invalid dataset ID — graceful error, no crash | ✅ |
| Duplicate registration — caught and rejected cleanly | ✅ |

### Open Defects

| ID | Description | Severity | Target |
|----|-------------|----------|--------|
| DEF-01 | Navbar toggle inconsistent on desktop viewport | Minor | April 2026 |
| DEF-02 | API endpoints accessible without authentication token | Medium | April 2026 |
| DEF-03 | Frontend route guards not yet enforced | Medium | April 2026 |

<br>

---

## 12. Risk Management

Full register → **[documentation/riskregister.md](documentation/riskregister.md)**  
**10 risks tracked** across the full project lifecycle.

| Level | Risks | Count |
|-------|-------|-------|
| 🔴 **High — Active** | R5 (Integration between modules) · R7 (Late defects) | 2 |
| 🟡 **Medium — Monitoring** | R1 (Attendance) · R2 (Requirements) · R4 (Version control) · R6 (Team conflict) · R8 (Demo failure) · R9 (Scope creep) · R10 (Data privacy) | 7 |
| 🟢 **Low — Resolved** | R3 (Skills gaps — resolved at sprint 1) | 1 |

### Mitigations That Are Active Now

| Risk | Mitigation in place |
|------|---------------------|
| R5 — Integration | API contracts documented before coding; smoke tests validate the full pipeline after every backend change |
| R7 — Late defects | Continuous testing — tests run and recorded after every feature; DEF-02 and DEF-03 prioritised for resolution |
| R8 — Demo failure | Full demo rehearsed multiple times; screen recording prepared as fallback; every team member can explain all features |
| R10 — Data privacy | Only synthetic/sample data committed to the repo; DEF-02 fix (API auth) scheduled before final submission |

<br>

---

## 13. Running the System

```bash
git clone https://github.com/shamykyzer/systems-development-group-project.git
cd systems-development-group-project
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001/api |
| Backend status | http://localhost:5001 |

<br>

---

## 14. Document Index

| Document | What it contains |
|----------|-----------------|
| [Risk Register](documentation/riskregister.md) | 10 risks — full detail on likelihood, impact, mitigation, contingency, and change history |
| [Test Plan](documentation/testtable.md) | 43 test cases — functional, security, API, performance, and accessibility results |

<br>

---

<div align="center">

*Bristol-Pink Bakery Sales Prediction System*
*Systems Development Group Project — University of the West of England 2025–2026*

</div>
