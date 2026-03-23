"""
Algorithm comparison module for Pink Cafe forecasting.

Backtests Prophet, SARIMA, and Linear Regression on historical data
and returns MAE / MSE metrics for each.
"""

import warnings
import logging
import numpy as np
import pandas as pd
from prophet import Prophet
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.linear_model import LinearRegression
from prophet_settings import get_active_preset, get_preset
from forecasting import ForecastError, load_history

logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _backtest_split(history, test_days=14):
    """Split history into train and test DataFrames."""
    n = len(history)
    # Ensure test set is reasonable: at most 25% of data, at least 3 days
    effective_test = min(test_days, max(3, n // 4))
    if n - effective_test < 7:
        raise ForecastError(
            f"Not enough data for backtesting: {n} days total, "
            f"need at least {effective_test + 7}"
        )
    train = history.iloc[:-effective_test].copy()
    test = history.iloc[-effective_test:].copy()
    return train, test, effective_test


def _compute_metrics(actual, predicted):
    """Return MAE and MSE given aligned actual/predicted arrays."""
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    mae = float(np.mean(np.abs(actual - predicted)))
    mse = float(np.mean((actual - predicted) ** 2))
    return {"mae": round(mae, 2), "mse": round(mse, 2)}


# ---------------------------------------------------------------------------
# Individual algorithm backtests
# ---------------------------------------------------------------------------

def _prophet_backtest(train_df, test_df, conn):
    """Fit Prophet on train, predict on test dates, return metrics."""
    try:
        active_name = get_active_preset(conn)
        cfg = get_preset(conn, active_name)

        m = Prophet(
            growth=cfg["growth"],
            changepoint_prior_scale=cfg["changepoint_prior_scale"],
            seasonality_prior_scale=cfg["seasonality_prior_scale"],
            seasonality_mode=cfg["seasonality_mode"],
            yearly_seasonality=bool(cfg["yearly_seasonality"]),
            weekly_seasonality=bool(cfg["weekly_seasonality"]),
            daily_seasonality=bool(cfg["daily_seasonality"]),
            n_changepoints=cfg["n_changepoints"],
            changepoint_range=cfg["changepoint_range"],
            interval_width=cfg["interval_width"],
            holidays_prior_scale=cfg["holidays_prior_scale"],
        )

        if cfg["growth"] == "logistic":
            train_df = train_df.copy()
            train_df["floor"] = cfg["floor_multiplier"] * train_df["y"].min()
            train_df["cap"] = cfg["cap_multiplier"] * train_df["y"].max()

        if cfg["custom_seasonality_enabled"] and cfg.get("custom_seasonality_name"):
            m.add_seasonality(
                name=cfg["custom_seasonality_name"],
                period=cfg["custom_seasonality_period"],
                fourier_order=cfg["custom_seasonality_fourier_order"],
            )

        m.fit(train_df)

        future = pd.DataFrame({"ds": test_df["ds"]})
        if cfg["growth"] == "logistic":
            future["floor"] = cfg["floor_multiplier"] * train_df["y"].min()
            future["cap"] = cfg["cap_multiplier"] * train_df["y"].max()

        forecast = m.predict(future)
        predicted = forecast["yhat"].clip(lower=0).values

        return _compute_metrics(test_df["y"].values, predicted)
    except Exception as e:
        logging.exception("Prophet backtest failed")
        return {"error": str(e)}


def _sarima_backtest(train_df, test_df):
    """Fit SARIMA on train, predict on test dates, return metrics."""
    try:
        y_train = train_df.set_index("ds")["y"].asfreq("D")
        y_train = y_train.ffill()  # fill any gaps in daily data
        steps = len(test_df)

        predicted = None

        # Try seasonal SARIMA first
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                model = SARIMAX(
                    y_train,
                    order=(1, 1, 1),
                    seasonal_order=(1, 1, 1, 7),
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                )
                fit = model.fit(disp=False, maxiter=200)
                predicted = fit.forecast(steps=steps).values
            except Exception:
                # Fallback: simple ARMA (no seasonal component)
                model = SARIMAX(
                    y_train,
                    order=(1, 0, 1),
                    seasonal_order=(0, 0, 0, 0),
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                )
                fit = model.fit(disp=False, maxiter=200)
                predicted = fit.forecast(steps=steps).values

        predicted = np.clip(predicted, 0, None)
        return _compute_metrics(test_df["y"].values, predicted)
    except Exception as e:
        logging.exception("SARIMA backtest failed")
        return {"error": str(e)}


def _linreg_backtest(train_df, test_df):
    """Fit Linear Regression (trend + day-of-week) on train, return metrics."""
    try:
        def _build_features(df):
            ds = pd.to_datetime(df["ds"])
            day_index = (ds - ds.min()).dt.days.values.reshape(-1, 1)
            dow = pd.get_dummies(ds.dt.dayofweek, prefix="dow", dtype=float)
            return np.hstack([day_index, dow.values])

        # Use a common reference date so day_index is consistent
        all_ds = pd.concat([train_df["ds"], test_df["ds"]])
        ref_date = pd.to_datetime(all_ds).min()

        def _features(df):
            ds = pd.to_datetime(df["ds"])
            day_index = (ds - ref_date).dt.days.values.reshape(-1, 1)
            dow = pd.get_dummies(ds.dt.dayofweek, prefix="dow", dtype=float)
            # Ensure all 7 days are present
            for d in range(7):
                col = f"dow_{d}"
                if col not in dow.columns:
                    dow[col] = 0.0
            dow = dow[[f"dow_{d}" for d in range(7)]]
            return np.hstack([day_index, dow.values])

        X_train = _features(train_df)
        X_test = _features(test_df)

        model = LinearRegression()
        model.fit(X_train, train_df["y"].values)
        predicted = np.clip(model.predict(X_test), 0, None)

        return _compute_metrics(test_df["y"].values, predicted)
    except Exception as e:
        logging.exception("Linear Regression backtest failed")
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_comparison(conn, dataset_id, item_id, train_weeks, test_days=14):
    """
    Compare Prophet, SARIMA, and Linear Regression via backtesting.

    Returns a dict ready to be JSON-serialized with metrics for each algorithm.
    """
    history = load_history(conn, dataset_id, item_id, train_weeks)
    train_df, test_df, effective_test = _backtest_split(history, test_days)

    results = {
        "prophet": _prophet_backtest(train_df, test_df, conn),
        "sarima": _sarima_backtest(train_df, test_df),
        "linear_regression": _linreg_backtest(train_df, test_df),
    }

    return {
        "success": True,
        "dataset_id": dataset_id,
        "item_id": item_id,
        "train_weeks": train_weeks,
        "test_days": effective_test,
        "test_period": {
            "start": str(test_df["ds"].iloc[0].date()),
            "end": str(test_df["ds"].iloc[-1].date()),
        },
        "results": results,
    }
