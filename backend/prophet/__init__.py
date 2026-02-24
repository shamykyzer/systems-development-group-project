"""Prophet and forecasting ML module.

Contains:
- forecasting: Prophet + baseline algorithms, run_forecast, zoom_forecast
- batch: Standalone batch script for PNG output (Docker prophet target)
- _fb: Loader for Facebook Prophet library (avoids package name shadowing)
"""

from prophet.forecasting import (
    ForecastError,
    forecast_baseline_seasonal_naive_7,
    forecast_prophet,
    run_forecast,
    zoom_forecast,
)

__all__ = [
    "ForecastError",
    "forecast_baseline_seasonal_naive_7",
    "forecast_prophet",
    "run_forecast",
    "zoom_forecast",
]
