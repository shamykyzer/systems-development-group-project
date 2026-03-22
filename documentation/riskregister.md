# Risk Register

> **Bristol-Pink Bakery Sales Prediction System**
> Systems Development Group Project — University of the West of England
> Last reviewed: **March 22, 2026** | Next review: **No further scheduled review (final pre-submission update)**

---

## Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Risk Rating Criteria](#2-risk-rating-criteria)
3. [Risk Appetite](#3-risk-appetite)
4. [Active Risk Register](#4-active-risk-register)
5. [Individual Risk Detail](#5-individual-risk-detail)
6. [Risk Matrix](#6-risk-matrix)
7. [Change Log](#7-change-log)

---

## 1. Purpose & Scope

This document identifies, assesses, and tracks all risks relevant to the design and delivery of the Bristol-Pink Bakery Sales Prediction System. It covers the full project lifecycle from initial research through final submission on April 2, 2026.

The register is reviewed and updated by the team at each group workshop. Any team member may raise a new risk; the group collectively agrees on the rating and assigns a named owner responsible for monitoring and executing the mitigation.

**Project team:**

| Name | Role |
|------|------|
| Nickolas Greiner | Backend development |
| Aaron Agoas Antal-Bento | Frontend development |
| Oliver Mercer | Frontend / Integration |
| Oliver Churchley | AI model / Data |
| Ahmed Mohamed Mohamed Desoky AlShamy | Testing / Documentation |

---

## 2. Risk Rating Criteria

Risks are assessed on two independent dimensions — **Likelihood** (probability of occurrence) and **Impact** (consequence if it occurs). The combination of these determines the **Overall** risk level.

### Likelihood

| Rating | Description |
|--------|-------------|
| **Low** | Unlikely to occur given current circumstances; no current indicators |
| **Medium** | Could occur; some indicators or precedent exist |
| **High** | Likely to occur; strong indicators already present |

### Impact

| Rating | Description |
|--------|-------------|
| **Low** | Minor inconvenience; recoverable with minimal effort and no schedule impact |
| **Medium** | Moderate disruption; causes delay or requires rework but does not threaten delivery |
| **High** | Significant; threatens on-time delivery, system quality, or marks/grades |

### Overall Risk Level

|  | **Low Impact** | **Medium Impact** | **High Impact** |
|--|--------------|-----------------|----------------|
| **Low Likelihood** | 🟢 Low | 🟢 Low | 🟡 Medium |
| **Medium Likelihood** | 🟢 Low | 🟡 Medium | 🔴 High |
| **High Likelihood** | 🟡 Medium | 🔴 High | 🔴 High |

---

## 3. Risk Appetite

The team has a **low tolerance** for risks affecting system functionality, security, and final submission quality. We accept a **moderate tolerance** for minor UI/UX defects and internal communication challenges, provided they do not block core feature delivery.

All risks rated **High** are escalated immediately and assigned a named owner. Risks rated **Medium** are reviewed at every workshop. **Low** risks are reviewed monthly or when a status change is observed.

As this is the final pre-submission review, no further scheduled risk workshops remain; any new issues will be managed as immediate actions through to submission.

---

## 4. Active Risk Register

| ID | Risk Summary | Likelihood | Impact | Overall | Owner | Status |
|----|-------------|-----------|--------|---------|-------|--------|
| [R1](#r1--team-attendance--meeting-delays) | Team attendance and meeting delays | Medium | Medium | 🟡 Medium | All | Monitoring |
| [R2](#r2--requirements-misunderstood-or-poorly-validated) | Requirements misunderstood or poorly validated | Low | High | 🟡 Medium | All | Monitoring |
| [R3](#r3--skills-gaps-slowing-implementation) | Skills gaps slowing implementation | Low | Low | 🟢 Low | All | ✅ Resolved |
| [R4](#r4--version-control-issues) | Version control issues — merge conflicts / lost work | Low | High | 🟡 Medium | All | Monitoring |
| [R5](#r5--integration-problems-between-modules) | Integration problems between frontend, backend, and AI | Medium | High | 🔴 High | Oliver M. / Nickolas | 🔴 Active |
| [R6](#r6--team-conflict-or-communication-breakdown) | Team conflict or communication breakdown | Low | High | 🟡 Medium | All | Monitoring |
| [R7](#r7--critical-defects-discovered-late-in-testing) | Critical defects discovered late in testing | Medium | High | 🔴 High | Ahmed | 🔴 Active |
| [R8](#r8--live-demo-or-presentation-failure) | Live demo or presentation fails to run | Low | High | 🟡 Medium | All | Monitoring |
| [R9](#r9--scope-creep-overrunning-the-sprint-timeline) | Scope creep overrunning the sprint timeline | Medium | Medium | 🟡 Medium | All | Monitoring |
| [R10](#r10--data-privacy--sensitive-sales-data-exposure) | Data privacy — sensitive sales data exposed | Low | High | 🟡 Medium | Nickolas | Monitoring |

---

## 5. Individual Risk Detail

---

### R1 — Team Attendance & Meeting Delays

> *Team member(s) missing workshops or meetings, causing delays in planning and development.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
The project relies on in-person workshops and group check-ins to align on progress, review pull requests, and coordinate integration work. Unplanned absences — due to illness, conflicting timetables, or personal commitments — can cause planning gaps and block tasks that depend on team decisions.

**Mitigation:**
- Agreed attendance expectations communicated at project kickoff.
- Shared group chat (Discord) for asynchronous updates when attendance is not possible.
- Meeting notes and decisions logged so absent members can catch up without blocking others.
- Tasks are assigned at the start of each sprint to reduce dependency on synchronous decisions.

**Contingency:**
- Tasks are temporarily reassigned to available team members.
- Sprint timeline adjusted; non-critical tasks deprioritised.
- If absences become persistent, escalate to tutor for guidance.

---

### R2 — Requirements Misunderstood or Poorly Validated

> *Requirements are incorrectly interpreted, leading to wasted development effort or features that do not meet the brief.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | High |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
The project brief requires both functional and non-functional requirements to be clearly stated and correctly understood. Feedback from the mid-project presentation highlighted that the team's initial phrasing of these requirements was ambiguous — functional and non-functional definitions were mixed. Misaligned requirements could result in building the wrong features or failing to satisfy the assessment criteria.

**Mitigation:**
- Regular tutor check-ins to validate requirement interpretation before major development sprints.
- Requirements documented formally in the README as testable "the system shall..." statements.
- Peer review of requirements section during team workshops.
- Distinction between functional (what the system *does*) and non-functional (how well it *performs*) requirements enforced in all documentation.

**Contingency:**
- Re-scope affected features as soon as a misalignment is identified.
- Prioritise essential requirements; defer any optional or misaligned features.
- Use tutor office hours to clarify uncertain requirements before implementation begins.

---

### R3 — Skills Gaps Slowing Implementation

> *Gaps in technical skills within the team slow down development of specific features.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | Low |
| **Overall** | 🟢 Low |
| **Owner** | All team members |
| **Status** | ✅ Resolved |

**Why this risk exists:**
The project requires competency across multiple domains — React frontend development, Python/Flask backend, SQLite, Docker, and Meta's Prophet time-series model. It was possible that individual team members would lack experience in one or more of these areas, slowing delivery.

**Mitigation:**
- Early skills assessment conducted using team CVs and self-assessment; tasks allocated to play to individual strengths.
- Pair programming and knowledge-sharing sessions arranged where skill gaps were identified.
- Documentation, tutorials, and sample code shared via the group Discord.

**Contingency:**
- If a skill gap blocked progress, tasks were reallocated to a more experienced team member while the original assignee contributed elsewhere.
- Feature scope simplified where necessary to match available expertise.

**Resolution note:** This risk was resolved early in the project following task allocation. All core skills are now covered within the team. The risk remains Low and will not be re-escalated unless a new technical requirement emerges.

---

### R4 — Version Control Issues

> *Merge conflicts, accidental overwrites, or lost work disrupts the codebase.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | High |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
The team is collaborating across five members on a shared GitHub repository. Without disciplined branching and commit practices, merge conflicts can corrupt stable code or lose completed work. This risk is higher during integration sprints when multiple modules are merged simultaneously.

**Mitigation:**
- All work is done on dedicated feature branches — direct commits to `main` are blocked.
- Pull requests require approval from **at least two team members** before merging.
- GitHub Actions CI runs on every PR to flag regressions before merge.
- Commit messages follow a consistent, descriptive format so history is navigable.
- Regular commits ensure that work-in-progress is never at risk of being lost.

**Contingency:**
- Revert to the last known-stable branch using `git revert` or `git reset`.
- Restore from Git commit history — no work is permanently lost if committed.
- If a major conflict arises, the team reviews the diff together synchronously before merging.

---

### R5 — Integration Problems Between Modules

> *Incompatibilities between the React frontend, Flask backend, and Prophet AI model cause failures during integration.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium |
| **Impact** | High |
| **Overall** | 🔴 High |
| **Owner** | All team members |
| **Status** | 🔴 Active |

**Why this risk exists:**
The system comprises three independently developed modules — the React frontend, the Python/Flask REST API, and the Prophet forecasting model — which must communicate correctly over clearly defined API contracts. Data format mismatches, CORS configuration errors, or model output shape changes can silently break the integration without either module showing an individual error. This is the highest-priority risk currently open.

**Mitigation:**
- API contracts (endpoints, request/response shapes) agreed and documented in the README before implementation begins.
- CORS configuration handled centrally via the `config.py` environment variable (`CORS_ORIGINS`).
- Backend smoke test suite (`backend_smoke_test.sh`) validates the full pipeline — CSV upload → analytics → forecast — after every significant backend change.
- GitHub Actions CI enforces that the smoke test must pass before any PR is merged to `main`.
- Docker Compose used for local integration testing to replicate the production environment.

**Contingency:**
- Delay advanced features; merge a minimal working version of each module first to maintain a stable baseline.
- If the Prophet model output breaks the frontend, fall back to the `baseline` algorithm while the issue is diagnosed.
- Roll back the last stable release tag and investigate the breaking change in isolation.

---

### R6 — Team Conflict or Communication Breakdown

> *Disagreements or communication failures within the team disrupt collaboration and reduce productivity.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | High |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
Group projects with five contributors require sustained communication and mutual respect. Disagreements over technical decisions, workload distribution, or code quality standards can escalate if not resolved promptly, impacting team morale and output quality.

**Mitigation:**
- Roles and responsibilities clearly defined at project kickoff to prevent ownership disputes.
- Technical decisions documented and discussed openly in group workshops rather than unilaterally.
- A respectful, constructive team culture enforced; all feedback given on the code, not the person.
- Regular check-ins to surface any frustrations early before they escalate.

**Contingency:**
- Minor disagreements resolved within the team using a simple majority vote.
- If the issue cannot be resolved internally, escalate to the module tutor for mediation.
- If workload becomes unbalanced due to a team conflict, redistribute tasks across available members.

---

### R7 — Critical Defects Discovered Late in Testing

> *Major bugs are only discovered near the submission deadline, leaving insufficient time to fix them.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium |
| **Impact** | High |
| **Overall** | 🔴 High |
| **Owner** | Ahmed Mohamed Mohamed Desoky AlShamy |
| **Status** | 🔴 Active |

**Why this risk exists:**
If testing is deferred to the final weeks of the project, defects that have accumulated across multiple features become difficult to diagnose and fix under time pressure. The current test plan (43 test cases) has an 91% pass rate with 3 open defects — two of which are medium-severity security gaps (route protection and API authentication). These must be resolved before final submission.

**Open defects driving this risk:**
- **DEF-02** — API endpoints accessible without authentication (no JWT / session token enforcement on the backend).
- **DEF-03** — Frontend route guards not implemented — authenticated pages accessible via direct URL.

**Mitigation:**
- Testing is conducted continuously — after every new feature addition, not batched at the end.
- All test outcomes are tracked in the [test plan](testtable.md) with corrective actions recorded.
- GitHub Actions prevents broken code from merging to `main`, reducing the chance of defects accumulating silently.
- Defects are prioritised by severity immediately when found: critical → high → medium → low.

**Contingency:**
- Temporarily pause new feature development and focus entirely on defect resolution if the open defect count rises.
- Prioritise security defects (DEF-02, DEF-03) first as these are medium severity and affect the assessment criteria.
- Accept and document known limitations for low-severity defects if time runs out, with a clear note in the README.

---

### R8 — Live Demo or Presentation Failure

> *The live demonstration during the VIVA fails due to a technical issue or poor preparation.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | High |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
This risk was explicitly highlighted in mid-project presentation feedback. The demo involves running a full Docker stack live, which is sensitive to network conditions, port conflicts, and system state. A failed demo would prevent assessors from seeing the system at its best, regardless of the underlying quality of the code.

Additionally, peer feedback noted that the overall presentation flow and slide structure needed improvement — a poorly structured delivery could undermine confidence in the project even if the system itself is strong.

**Mitigation:**
- Full end-to-end demo rehearsed multiple times in the actual demo environment before the VIVA.
- Every team member understands all features of the system and can explain and demonstrate any component.
- Presentation flow restructured following tutor feedback: Overview → Objectives → Requirements → Architecture → Demo → Testing → Conclusion.
- Docker Compose used for the demo to ensure a one-command startup with no manual dependency steps.
- README updated to serve as a live reference document during the presentation.

**Contingency:**
- A designated backup presenter is identified who can take over if the primary presenter has difficulties.
- Screenshots and a screen recording of a successful full demo run are prepared as a fallback.
- If the live system fails to start, walk through the recording and code to demonstrate understanding.

---

### R9 — Scope Creep Overrunning the Sprint Timeline

> *Additional features or unplanned changes are added during development, pushing core deliverables past the deadline.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Medium |
| **Impact** | Medium |
| **Overall** | 🟡 Medium |
| **Owner** | All team members |
| **Status** | Monitoring |

**Why this risk exists:**
As the project progresses it can be tempting to add new features beyond the original scope — additional chart types, extended forecast horizons, or new security features. While individually small, these additions consume development time and can push critical path tasks (integration, testing, documentation) past their deadlines.

**Mitigation:**
- Core S.M.A.R.T. objectives kept visible in the README and reviewed at the start of every sprint.
- New feature requests are evaluated against the remaining timeline before being accepted; only added if they do not delay a higher-priority item.
- A formal "must have / should have / nice to have" priority system applied to the backlog.
- Gantt chart maintained and consulted when assessing whether new work can be accommodated.

**Contingency:**
- Immediately freeze new feature additions if the critical path is at risk; focus entirely on completing in-progress work.
- Defer out-of-scope features to a post-submission improvement list clearly labelled "Further Development" in the README.

---

### R10 — Data Privacy – Sensitive Sales Data Exposure

> *Real-world or commercially sensitive sales data uploaded to the system is exposed due to inadequate access controls.*

| Field | Detail |
|-------|--------|
| **Likelihood** | Low |
| **Impact** | High |
| **Overall** | 🟡 Medium |
| **Owner** | Nickolas Greiner |
| **Status** | Monitoring |

**Why this risk exists:**
The system ingests real sales data (CSV files) from a café business. If the API is accessible without authentication — which is currently the case (DEF-02) — any party with network access to the backend could read all uploaded datasets and sales records. This is both a functional defect and a data privacy concern.

**Mitigation:**
- Passwords are hashed using bcrypt — no plain-text credentials stored anywhere.
- Generic error messages used on login to prevent user enumeration.
- Authentication endpoints (`/register`, `/login`) are implemented and functional.
- Route protection (DEF-02, DEF-03) is a known open defect and is scheduled for resolution before final submission.
- Sample/synthetic datasets used for all demo and testing purposes — no production customer data committed to the repository.

**Contingency:**
- If real data were exposed, isolate the system immediately and rotate any credentials.
- Prioritise DEF-02 (API auth enforcement) as the highest-severity open defect.
- Advise any real data owners that data should not be uploaded until route protection is implemented.

---

## 6. Risk Matrix

The matrix below plots all ten risks by **Likelihood** (x-axis) and **Impact** (y-axis).

```
          │           L O W         │       M E D I U M       │         H I G H         │
          │        Likelihood       │      Likelihood         │       Likelihood        │
──────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
  H I G H │  R2  R4  R6  R8  R10    │      R5    R7           │                         │
  Impact  │  (🟡 Medium)            │      (🔴 High)         │                         │
──────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
 M E D I U│                         │      R1    R9           │                         │
 M Impact │                         │      (🟡 Medium)        │                         │
──────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
   L O W  │       R3                │                         │                         │
  Impact  │      (🟢 Low)           │                         │                         │
──────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Risk Summary by Level

| Level | Risks | Count |
|-------|-------|-------|
| 🔴 **High** | R5 (Integration), R7 (Late defects) | 2 |
| 🟡 **Medium** | R1 (Attendance), R2 (Requirements), R4 (Version control), R6 (Team conflict), R8 (Demo failure), R9 (Scope creep), R10 (Data privacy) | 7 |
| 🟢 **Low** | R3 (Skills gaps) | 1 |

---

## 7. Change Log

All changes to risk ratings, status, or new risks added are recorded here.

| Date | ID | Change | Actioned By |
|------|----|--------|-------------|
| Oct 2025 | R1 | Register created. R1–R7 identified in kickoff workshop. Likelihood and impact ratings agreed by full team. | All |
| Oct 2025 | R1 | Rated **High** following first sprint — one member missed two consecutive sessions. Action: mandatory Discord check-in policy introduced. | Oliver M. |
| Oct 2025 | R4 | Rated **Medium** — GitHub repo created and branch protection rules configured; PR approval requirement set to 2 reviewers. Status set to Monitoring. | Shamyy |
| Nov 2025 | R2 | Reviewed after first tutor check-in. Requirements confirmed as understood; rating held at Medium, status remains Monitoring. | All |
| Nov 2025 | R3 | Skills gap review completed. Gaps identified in ML/Prophet knowledge across two members. Mitigation: self-study resources shared via Discord. Status: Active. | Aaron |
| Nov 2025 | R6 | Minor task allocation dispute resolved at workshop. Roles clarified and logged in Gantt. Status held at Monitoring. | Oliver C. |
| Dec 2025 | R1 | Attendance stabilised. No missed sessions in December. Status downgraded to Monitoring. | Oliver M. |
| Dec 2025 | R5 | Flagged as emerging risk — backend and frontend development beginning in parallel; API contracts not yet finalised. Status set to Monitoring. | Nickolas |
| Jan 2026 | R3 | Prophet self-study completed. Aaron and Shamyy confirmed comfortable with implementation. Status updated to Resolved. | Aaron |
| Jan 2026 | R5 | Escalated to **Active** — integration between the Prophet model, Flask API, and React frontend is ongoing. API contracts under active development. | Oliver M. |
| Jan 2026 | R7 | Rated **Medium** — development velocity increasing; risk of late defects raised at sprint review. Status: Monitoring. | Ahmed |
| Feb 2026 | R3 | Formally marked **Resolved** following successful task allocation based on completed skills assessment. | All |
| Feb 2026 | R7 | Escalated to **Active** — 3 open defects identified in test plan (DEF-01 minor, DEF-02 and DEF-03 medium security gaps). | Ahmed |
| Feb 2026 | R8 | Added following mid-project presentation — tutor and peer feedback highlighted presentation flow and demo resilience as areas for improvement. | All |
| Feb 2026 | R9 | Added to reflect growing backlog of potential enhancements identified during development. | All |
| Feb 2026 | R10 | Added to capture the data privacy implications of the currently-open DEF-02 (unauthenticated API access). | Nickolas |
| Mar 2026 | All | Final risk register review completed ahead of submission (due April 2, 2026). Existing ratings retained; focus moved to closure of active integration/testing/security actions. | All |
