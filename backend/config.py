"""Shared backend configuration values."""

PROPHET_PRESET_DEFAULTS = {
    "growth": "linear",
    "changepoint_prior_scale": 0.15,
    "seasonality_prior_scale": 15.0,
    "seasonality_mode": "additive",
    "daily_seasonality": False,
    "weekly_seasonality": True,
    "yearly_seasonality": False,
    "forecast_periods": 365,
    "floor_multiplier": 0.5,
    "cap_multiplier": 1.5,
    "custom_seasonality_enabled": False,
    "custom_seasonality_name": "",
    "custom_seasonality_period": 30.5,
    "custom_seasonality_fourier_order": 3,
    "n_changepoints": 25,
    "changepoint_range": 0.8,
    "interval_width": 0.80,
    "holidays_prior_scale": 10.0,
    "holidays": [],
}
