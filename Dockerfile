# ============================================
# Multi-Stage Dockerfile for Pink Cafe Project
# ============================================

# ============================================
# Stage 1: React Frontend
# ============================================
FROM node:18-alpine AS frontend

WORKDIR /app

# Copy package files
COPY pinkcafe/package.json pinkcafe/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY pinkcafe/src ./src
COPY pinkcafe/public ./public
COPY pinkcafe/*.config.js ./
COPY pinkcafe/*.json ./

# Expose React dev server port
EXPOSE 3000

# Start React development server
CMD ["npm", "start"]

# ============================================
# Stage 2: Flask Backend
# ============================================
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY pinkcafe/Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY pinkcafe/Backend/ .

# Create directory for database
RUN mkdir -p /app/data

# Expose Flask port
EXPOSE 5000

# Run Flask app
CMD ["python", "app.py"]

# ============================================
# Stage 3: Prophet Forecasting Service
# ============================================
FROM python:3.11-slim AS prophet

WORKDIR /app/backend

# Install system dependencies required for Prophet
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY pinkcafe/Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and data
COPY pinkcafe/Backend/ .

# Create output directory for forecast visualizations
RUN mkdir -p /app/output

# Set environment to non-interactive for matplotlib
ENV MPLBACKEND=Agg

# Run Prophet forecasting script
CMD ["python", "Prophet.py"]