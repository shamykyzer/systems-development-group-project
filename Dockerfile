#
# One Dockerfile for the whole project.
#
# Stages:
#   frontend-build  Build React static assets (prod)
#   python-deps     Install Python packages into a venv
#   backend         Dev Flask server  (used by docker-compose backend/* targets)
#   prophet         Prophet batch job (used by docker-compose prophet target)
#   frontend        Dev React server  (used by docker-compose frontend target)
#   app             Combined prod image (Flask serves API + built React assets)
#

# ============================================
# Stage 1: Build React frontend
# ============================================
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY pinkcafe/package.json pinkcafe/package-lock.json ./
RUN npm ci
COPY pinkcafe/ ./
RUN npm run build

# ============================================
# Stage 2: Python dependencies (venv)
# ============================================
FROM python:3.11-slim AS python-deps
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Some scientific / Prophet deps require compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
COPY backend/requirements.txt ./requirements.txt
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/venv/bin:$PATH"

# ============================================
# Stage 3: Development targets
# ============================================
FROM python-deps AS backend
WORKDIR /app
COPY backend/ ./
EXPOSE 5001
CMD ["python", "app.py"]

FROM backend AS prophet
ENV MPLBACKEND=Agg
CMD ["python", "Prophet/prophet.py"]

FROM node:18-alpine AS frontend
WORKDIR /app
COPY pinkcafe/package.json pinkcafe/package-lock.json ./
RUN npm ci
COPY pinkcafe/ ./
RUN chmod -R +x node_modules/.bin/
EXPOSE 3000
CMD ["npm", "start"]

# ============================================
# Stage 4: Combined production image
# ============================================
FROM python:3.11-slim AS app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    FRONTEND_DIR="/app/frontend" \
    DATABASE_PATH="/app/data/pinkcafe.db"

WORKDIR /app
COPY --from=python-deps /opt/venv /opt/venv
COPY backend/ /app/backend/
COPY --from=frontend-build /app/build/ /app/frontend/
RUN mkdir -p /app/data

WORKDIR /app/backend
EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "4", \
     "--access-logfile", "-", "--error-logfile", "-", "app:app"]