from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from .analytics import get_dataset_end_date


class ForecastError(ValueError):
    pass


def _parse_iso_date(s: str) -> date:
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception as e:  # noqa: BLE001
        raise ForecastError(f"Invalid ISO date: {s!r}") from e


def _to_iso(d: date) -> str:
    return d.strftime("%Y-%m-%d")


def _require_train_weeks(train_weeks: int) -> None:
    if train_weeks < 4 or train_weeks > 8:
        raise ForecastError("train_weeks must be between 4 and 8")


def compute_train_window(conn, dataset_id: int, train_weeks: int) -> Tuple[str, str]:
    _require_train_weeks(train_weeks)
    end_iso = get_dataset_end_date(conn, dataset_id)
    if end_iso is None:
        raise ForecastError("dataset has no sales data")
    end_d = _parse_iso_date(end_iso)
    start_d = end_d - timedelta(days=train_weeks * 7 - 1)
    return _to_iso(start_d), _to_iso(end_d)


def load_item_series(
    conn,
    dataset_id: int,
    item_id: int,
    start_iso: str,
    end_iso: str,
) -> pd.DataFrame:
    """
    Returns a continuous daily series between [start_iso, end_iso] inclusive.
    Missing days are filled with 0.

    Output columns:
      - ds: datetime64[ns]
      - y: float
    """
    rows = conn.execute(
        """
        SELECT date, SUM(quantity) AS quantity
        FROM sales
        WHERE dataset_id = ? AND item_id = ? AND date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
        """,
        (dataset_id, item_id, start_iso, end_iso),
    ).fetchall()

    start_d = _parse_iso_date(start_iso)
    end_d = _parse_iso_date(end_iso)
    if end_d < start_d:
        raise ForecastError("train window end must be >= start")

    by_date = {str(r["date"]): float(r["quantity"]) for r in rows}
    ds: List[datetime] = []
    y: List[float] = []
    d = start_d
    while d <= end_d:
        iso = _to_iso(d)
        ds.append(datetime.strptime(iso, "%Y-%m-%d"))
        y.append(by_date.get(iso, 0.0))
        d += timedelta(days=1)
    return pd.DataFrame({"ds": ds, "y": y})


def forecast_baseline_seasonal_naive_7(history: pd.DataFrame, horizon_days: int) -> pd.DataFrame:
    """
    Simple, fast baseline:
      yhat(t) = y(t-7) if available, else last observed
    """
    if horizon_days <= 0:
        raise ForecastError("horizon_days must be > 0")
    if history.empty:
        raise ForecastError("history is empty")

    hist = history.sort_values("ds").reset_index(drop=True)
    last_ds: datetime = hist["ds"].iloc[-1]
    y_values = hist["y"].tolist()

    future_ds = [last_ds + timedelta(days=i) for i in range(1, horizon_days + 1)]
    preds: List[float] = []
    for i in range(1, horizon_days + 1):
        idx = len(y_values) - 7 + (i - 1)
        if 0 <= idx < len(y_values):
            preds.append(float(y_values[idx]))
        else:
            preds.append(float(y_values[-1]))

    return pd.DataFrame(
        {
            "date": [d.strftime("%Y-%m-%d") for d in future_ds],
            "yhat": preds,
            "yhat_lower": [None] * horizon_days,
            "yhat_upper": [None] * horizon_days,
        }
    )


def forecast_prophet(history: pd.DataFrame, horizon_days: int) -> pd.DataFrame:
    """
    Prophet forecast for the next horizon_days beyond the last ds in history.
    """
    if horizon_days <= 0:
        raise ForecastError("horizon_days must be > 0")
    if history.empty:
        raise ForecastError("history is empty")

    # Local import so baseline-only usage doesn't require prophet import at runtime.
    from prophet import Prophet  # type: ignore

    df = history.sort_values("ds").reset_index(drop=True)
    m = Prophet(
        growth="linear",
        weekly_seasonality=True,
        yearly_seasonality=True,
        daily_seasonality=False,
    )
    m.fit(df)

    future = m.make_future_dataframe(periods=horizon_days, freq="D", include_history=False)
    fc = m.predict(future)[["ds", "yhat", "yhat_lower", "yhat_upper"]]
    fc["date"] = fc["ds"].dt.strftime("%Y-%m-%d")
    return fc[["date", "yhat", "yhat_lower", "yhat_upper"]]


def create_model_run(conn, dataset_id: int, item_id: int, algorithm: str, train_start: str, train_end: str, horizon_days: int, params: Dict[str, Any]) -> int:
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO model_runs (dataset_id, item_id, algorithm, train_start, train_end, horizon_days, params_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (dataset_id, item_id, algorithm, train_start, train_end, horizon_days, json.dumps(params)),
    )
    return int(cur.lastrowid)


def store_forecasts(conn, model_run_id: int, forecast_df: pd.DataFrame) -> None:
    cur = conn.cursor()
    rows = []
    for _, r in forecast_df.iterrows():
        rows.append(
            (
                model_run_id,
                str(r["date"]),
                float(r["yhat"]),
                None if pd.isna(r["yhat_lower"]) else float(r["yhat_lower"]),
                None if pd.isna(r["yhat_upper"]) else float(r["yhat_upper"]),
            )
        )
    cur.executemany(
        "INSERT INTO forecasts (model_run_id, date, yhat, yhat_lower, yhat_upper) VALUES (?, ?, ?, ?, ?)",
        rows,
    )


def run_forecast(
    conn,
    dataset_id: int,
    item_id: int,
    algorithm: str,
    train_weeks: int,
    horizon_weeks: int = 4,
) -> Dict[str, Any]:
    if horizon_weeks <= 0:
        raise ForecastError("horizon_weeks must be > 0")
    horizon_days = horizon_weeks * 7

    train_start, train_end = compute_train_window(conn, dataset_id, train_weeks)
    history = load_item_series(conn, dataset_id, item_id, train_start, train_end)
    if len(history) < train_weeks * 7:
        # This can happen if the dataset doesn't cover the full requested window.
        raise ForecastError("not enough data for requested training window")

    algo = (algorithm or "prophet").strip().lower()
    params = {"train_weeks": train_weeks, "horizon_weeks": horizon_weeks}

    if algo in {"baseline", "seasonal_naive", "seasonal_naive_7"}:
        algo_name = "baseline_seasonal_naive_7"
        fc = forecast_baseline_seasonal_naive_7(history, horizon_days)
    elif algo == "prophet":
        algo_name = "prophet"
        fc = forecast_prophet(history, horizon_days)
    else:
        raise ForecastError("algorithm must be 'prophet' or 'baseline'")

    run_id = create_model_run(
        conn,
        dataset_id=dataset_id,
        item_id=item_id,
        algorithm=algo_name,
        train_start=train_start,
        train_end=train_end,
        horizon_days=horizon_days,
        params=params,
    )
    store_forecasts(conn, run_id, fc)

    return {
        "model_run_id": run_id,
        "dataset_id": dataset_id,
        "item_id": item_id,
        "algorithm": algo_name,
        "train_window": {"start_date": train_start, "end_date": train_end},
        "horizon": {"weeks": horizon_weeks, "days": horizon_days},
        "forecast": fc.to_dict(orient="records"),
    }


def zoom_forecast(conn, model_run_id: int, start_iso: str, end_iso: str) -> Dict[str, Any]:
    start_d = _parse_iso_date(start_iso)
    end_d = _parse_iso_date(end_iso)
    if end_d < start_d:
        raise ForecastError("end must be >= start")

    run = conn.execute(
        "SELECT id, dataset_id, item_id, algorithm, train_start, train_end, horizon_days, created_at FROM model_runs WHERE id = ?",
        (model_run_id,),
    ).fetchone()
    if not run:
        raise ForecastError("unknown model_run_id")

    rows = conn.execute(
        """
        SELECT date, yhat, yhat_lower, yhat_upper
        FROM forecasts
        WHERE model_run_id = ? AND date BETWEEN ? AND ?
        ORDER BY date ASC
        """,
        (model_run_id, start_iso, end_iso),
    ).fetchall()

    return {
        "model_run": dict(run),
        "window": {"start_date": start_iso, "end_date": end_iso},
        "forecast": [dict(r) for r in rows],
    }

