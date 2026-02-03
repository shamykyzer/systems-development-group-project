from __future__ import annotations

import json
import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from .analytics import get_dataset_end_date, list_items_for_dataset
from .forecasting import (
    ForecastError,
    _parse_iso_date,  # internal helper, ok within package
    _to_iso,  # internal helper, ok within package
    forecast_baseline_seasonal_naive_7,
    forecast_prophet,
    load_item_series,
)


class EvaluationError(ValueError):
    pass


def _mae(y_true: List[float], y_pred: List[float]) -> float:
    return sum(abs(a - b) for a, b in zip(y_true, y_pred)) / max(1, len(y_true))


def _rmse(y_true: List[float], y_pred: List[float]) -> float:
    if not y_true:
        return 0.0
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(y_true, y_pred)) / len(y_true))


def _mape(y_true: List[float], y_pred: List[float]) -> float:
    pairs = [(a, b) for a, b in zip(y_true, y_pred) if a != 0]
    if not pairs:
        return 0.0
    return 100.0 * sum(abs((a - b) / a) for a, b in pairs) / len(pairs)


def _compute_backtest_windows(end_iso: str, train_weeks: int, horizon_weeks: int) -> Tuple[str, str, str, str]:
    if horizon_weeks <= 0:
        raise EvaluationError("horizon_weeks must be > 0")
    if train_weeks < 4 or train_weeks > 8:
        raise EvaluationError("train_weeks must be between 4 and 8")

    end_d = _parse_iso_date(end_iso)
    holdout_days = horizon_weeks * 7
    train_end_d = end_d - timedelta(days=holdout_days)
    holdout_start_d = train_end_d + timedelta(days=1)
    train_start_d = train_end_d - timedelta(days=train_weeks * 7 - 1)

    return (
        _to_iso(train_start_d),
        _to_iso(train_end_d),
        _to_iso(holdout_start_d),
        _to_iso(end_d),
    )


def _load_actual_holdout(conn, dataset_id: int, item_id: int, start_iso: str, end_iso: str) -> pd.DataFrame:
    return load_item_series(conn, dataset_id, item_id, start_iso, end_iso)


def evaluate_item_backtest(
    conn,
    dataset_id: int,
    item_id: int,
    algorithm: str,
    train_weeks: int,
    horizon_weeks: int,
) -> Dict[str, Any]:
    end_iso = get_dataset_end_date(conn, dataset_id)
    if end_iso is None:
        raise EvaluationError("dataset has no sales data")

    train_start, train_end, holdout_start, holdout_end = _compute_backtest_windows(
        end_iso, train_weeks=train_weeks, horizon_weeks=horizon_weeks
    )

    history = load_item_series(conn, dataset_id, item_id, train_start, train_end)
    actual = _load_actual_holdout(conn, dataset_id, item_id, holdout_start, holdout_end)
    if history.empty or actual.empty:
        raise EvaluationError("not enough data to evaluate this item")

    horizon_days = horizon_weeks * 7
    algo = (algorithm or "baseline").strip().lower()
    if algo in {"baseline", "seasonal_naive", "seasonal_naive_7"}:
        algo_name = "baseline_seasonal_naive_7"
        pred = forecast_baseline_seasonal_naive_7(history, horizon_days)
    elif algo == "prophet":
        algo_name = "prophet"
        pred = forecast_prophet(history, horizon_days)
    else:
        raise EvaluationError("algorithm must be 'prophet' or 'baseline'")

    # Align predictions with actual by date
    actual_map = {d.strftime("%Y-%m-%d"): float(y) for d, y in zip(actual["ds"], actual["y"])}
    y_true: List[float] = []
    y_pred: List[float] = []
    for r in pred.to_dict(orient="records"):
        dt = str(r["date"])
        if dt in actual_map:
            y_true.append(actual_map[dt])
            y_pred.append(float(r["yhat"]))

    if not y_true:
        raise EvaluationError("no overlap between prediction and actual holdout window")

    return {
        "dataset_id": dataset_id,
        "item_id": item_id,
        "algorithm": algo_name,
        "train_window": {"start_date": train_start, "end_date": train_end},
        "holdout_window": {"start_date": holdout_start, "end_date": holdout_end},
        "metrics": {
            "mae": _mae(y_true, y_pred),
            "rmse": _rmse(y_true, y_pred),
            "mape": _mape(y_true, y_pred),
        },
    }


def create_evaluation_run(conn, dataset_id: int, algorithm: str, params: Dict[str, Any]) -> int:
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO evaluation_runs (dataset_id, algorithm, params_json) VALUES (?, ?, ?)",
        (dataset_id, algorithm, json.dumps(params)),
    )
    return int(cur.lastrowid)


def store_metrics(conn, evaluation_run_id: int, item_id: int, metrics: Dict[str, float]) -> None:
    cur = conn.cursor()
    rows = [(evaluation_run_id, item_id, name, float(value)) for name, value in metrics.items()]
    cur.executemany(
        "INSERT INTO evaluation_metrics (evaluation_run_id, item_id, metric_name, metric_value) VALUES (?, ?, ?, ?)",
        rows,
    )


def run_evaluation(
    conn,
    dataset_id: int,
    algorithms: List[str],
    train_weeks: int,
    horizon_weeks: int,
    category: Optional[str] = None,
    item_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    items = list_items_for_dataset(conn, dataset_id, category)
    if item_ids is not None:
        items = [i for i in items if int(i["id"]) in set(item_ids)]
    if not items:
        raise EvaluationError("no items found for dataset/category selection")

    results: Dict[str, Any] = {"dataset_id": dataset_id, "runs": []}
    for algo in algorithms:
        algo_norm = (algo or "").strip().lower()
        if algo_norm in {"baseline", "seasonal_naive", "seasonal_naive_7"}:
            algo_name = "baseline_seasonal_naive_7"
        elif algo_norm == "prophet":
            algo_name = "prophet"
        else:
            raise EvaluationError("algorithms must be from: prophet, baseline")

        run_id = create_evaluation_run(
            conn,
            dataset_id=dataset_id,
            algorithm=algo_name,
            params={"train_weeks": train_weeks, "horizon_weeks": horizon_weeks, "category": category},
        )

        per_item = []
        for item in items:
            item_id_int = int(item["id"])
            try:
                r = evaluate_item_backtest(
                    conn,
                    dataset_id=dataset_id,
                    item_id=item_id_int,
                    algorithm=algo_name,
                    train_weeks=train_weeks,
                    horizon_weeks=horizon_weeks,
                )
                store_metrics(conn, run_id, item_id_int, r["metrics"])
                per_item.append({"item": item, "metrics": r["metrics"]})
            except (EvaluationError, ForecastError) as e:
                per_item.append({"item": item, "error": str(e)})

        results["runs"].append({"evaluation_run_id": run_id, "algorithm": algo_name, "results": per_item})

    return results

