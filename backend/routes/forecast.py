from flask import Blueprint, current_app, jsonify, request

from db import connect
from prophet.forecasting import ForecastError, run_forecast, zoom_forecast
from utils import json_error, require_int


bp = Blueprint("forecast", __name__)


@bp.get("/api/v1/forecast")
def forecast():
    dataset_id_raw = request.args.get("dataset_id")
    item_id_raw = request.args.get("item_id")
    train_weeks_raw = request.args.get("train_weeks", "6")
    horizon_weeks_raw = request.args.get("horizon_weeks", "4")
    algorithm = request.args.get("algorithm", "prophet")

    if not dataset_id_raw:
        return json_error("dataset_id is required", 400)
    if not item_id_raw:
        return json_error("item_id is required", 400)

    try:
        dataset_id = require_int("dataset_id", dataset_id_raw)
        item_id = require_int("item_id", item_id_raw)
        train_weeks = require_int("train_weeks", train_weeks_raw)
        horizon_weeks = require_int("horizon_weeks", horizon_weeks_raw)
    except ValueError as e:
        return json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            result = run_forecast(
                conn,
                dataset_id=dataset_id,
                item_id=item_id,
                algorithm=algorithm,
                train_weeks=train_weeks,
                horizon_weeks=horizon_weeks,
            )
            conn.commit()
            return jsonify(result)
        except ForecastError as e:
            return json_error(str(e), 400)


@bp.get("/api/v1/forecast/zoom")
def forecast_zoom():
    model_run_id_raw = request.args.get("model_run_id")
    start = request.args.get("start")
    end = request.args.get("end")

    if not model_run_id_raw:
        return json_error("model_run_id is required", 400)
    if not start or not end:
        return json_error("start and end are required (YYYY-MM-DD)", 400)

    try:
        model_run_id = require_int("model_run_id", model_run_id_raw)
    except ValueError as e:
        return json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            return jsonify(
                zoom_forecast(
                    conn, model_run_id=model_run_id, start_iso=start, end_iso=end
                )
            )
        except ForecastError as e:
            return json_error(str(e), 400)
