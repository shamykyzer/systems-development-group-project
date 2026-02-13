#
# One Dockerfile for the whole project:
# - builds the React frontend to static assets
# - installs Python backend deps (incl. Prophet deps)
# - produces a single runtime image that serves the frontend and API together
#

# ============================================
# Stage 1: Build React frontend
# ============================================
FROM node:18-alpine AS frontend-build
WORKDIR /app

# Install dependencies (cached)
COPY pinkcafe/package.json pinkcafe/package-lock.json ./
RUN npm ci

# Build
COPY pinkcafe/ ./
RUN npm run build
# ============================================
# Stage 2: Build Python deps (venv)
# ============================================
FROM python:3.11-slim AS python-deps
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Prophet (and some scientific deps) may require compilation at install-time
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
COPY src/backend/requirements.txt ./requirements.txt

RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

ENV PATH="/opt/venv/bin:$PATH"


# ============================================
# Stage 3: Dev targets (optional; used by docker-compose profiles)
# ============================================
FROM python-deps AS backend
WORKDIR /app
COPY src/backend/ ./
EXPOSE 5001
CMD ["python", "app.py"]

FROM backend AS prophet
WORKDIR /app
ENV MPLBACKEND=Agg
CMD ["python", "Prophet.py"]

FROM node:18-alpine AS frontend
WORKDIR /app
COPY pinkcafe/package.json pinkcafe/package-lock.json ./
RUN npm ci
COPY pinkcafe/ ./
EXPOSE 3000
CMD ["npm", "start"]


# ============================================
# Stage 4: Combined runtime (frontend + backend)
# ============================================
FROM python:3.11-slim AS app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    # Backend will look here to serve the React build
    FRONTEND_DIR="/app/frontend" \
    # Persist DB to a bind mount / named volume easily
    DATABASE_PATH="/app/data/pinkcafe.db"

WORKDIR /app

# Copy Python deps + backend code
COPY --from=python-deps /opt/venv /opt/venv
COPY src/backend/ /app/backend/

# Copy built frontend (CRA outputs to /app/build)
COPY --from=frontend-build /app/build/ /app/frontend/

# Runtime dirs
RUN mkdir -p /app/data

WORKDIR /app/backend
EXPOSE 5001

# Gunicorn entrypoint (see src/backend/app.py docstring)
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "4", "--access-logfile", "-", "--error-logfile", "-", "app:app"]