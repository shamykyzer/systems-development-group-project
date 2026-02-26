# ============================================================
#  prophet.py  -  YOUR JOB TO IMPLEMENT
# ============================================================
#
#  HOW IT FITS TOGETHER
#  --------------------
#  routes.py  -->  run_forecast()  -->  _prophet_forecast()
#  The frontend calls GET /api/v1/forecast?dataset_id=X&item_id=X
#  &algorithm=prophet&train_weeks=4&horizon_weeks=4
#
#  STEPS TO IMPLEMENT _prophet_forecast()
#  ---------------------------------------
#
#  1. Load the user's preset settings from the DB:
#        from prophet_settings import get_active_preset, get_preset
#        cfg = get_preset(conn, get_active_preset(conn))
#
#  2. Build the model using cfg values, e.g.:
#        m = Prophet(
#            growth                  = cfg["growth"],
#            changepoint_prior_scale = cfg["changepoint_prior_scale"],
#            seasonality_mode        = cfg["seasonality_mode"],
#            interval_width          = cfg["interval_width"],
#        )
#
#  3. Fit on history:  m.fit(history)
#     history is already a DataFrame with columns 'ds' (datetime) and 'y' (float)
#
#  4. Make a future frame and predict:
#        future = m.make_future_dataframe(periods=horizon_days, include_history=False)
#        forecast = m.predict(future)
#
#  5. Return a DataFrame with exactly these 4 columns:
#        date (str "YYYY-MM-DD"), yhat, yhat_lower, yhat_upper
#
#  TIPS
#  ----
#  - forecast["ds"].dt.strftime("%Y-%m-%d") converts dates to strings
#  - If growth="logistic" you MUST set floor/cap on both history + future
#    (cfg["floor_multiplier"] * min(y)  and  cfg["cap_multiplier"] * max(y))
#  - Suppress Prophet spam: import logging; logging.getLogger("prophet").setLevel(logging.WARNING)
#  - The app won't crash while you build this - routes.py catches ForecastError
#    and will return a 500 with the message you put in the NotImplementedError
#
# ============================================================

import pandas as pd


class ForecastError(ValueError):
    """Raised when a forecast cannot be produced."""
    pass


def run_forecast(conn, dataset_id, item_id, algorithm, train_weeks, horizon_weeks=4):
    """Entry point called by routes.py - implement _prophet_forecast() below."""
    raise NotImplementedError("run_forecast() not yet implemented - see notes above")


def _prophet_forecast(history: pd.DataFrame, horizon_days: int, conn=None) -> pd.DataFrame:
    """Implement Prophet forecast here - see notes at the top of this file."""
    raise NotImplementedError("_prophet_forecast() not yet implemented - see notes above")
