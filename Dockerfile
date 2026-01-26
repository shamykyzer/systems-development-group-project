# Python backend with Prophet forecasting
FROM python:3.11-slim

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