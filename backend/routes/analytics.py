from flask import Blueprint, current_app, jsonify, request

from db import connect
from services.analytics import (
    AnalyticsError,
    fluctuation,
    list_items_for_dataset,
    top_sellers,
)
from utils import json_error, require_int


bp = Blueprint("analytics", __name__)


@bp.get("/api/v1/items")
def list_items():
    dataset_id_raw = request.args.get("dataset_id")
    if not dataset_id_raw:
        return json_error("dataset_id is required", 400)
    try:
        dataset_id = require_int("dataset_id", dataset_id_raw)
    except ValueError as e:
        return json_error(str(e), 400)

    category = request.args.get("category")
    if category is not None:
        category = category.strip().lower()
        if category not in {"coffee", "food"}:
            return json_error("category must be 'coffee' or 'food'", 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        return jsonify(list_items_for_dataset(conn, dataset_id, category))


@bp.get("/api/v1/analytics/top-sellers")
def get_top_sellers():
    dataset_id_raw = request.args.get("dataset_id")
    category = (request.args.get("category") or "").strip().lower()
    weeks_raw = request.args.get("weeks", "4")
    limit_raw = request.args.get("limit", "3")

    if not dataset_id_raw:
        return json_error("dataset_id is required", 400)
    if category not in {"coffee", "food"}:
        return json_error("category must be 'coffee' or 'food'", 400)

    try:
        dataset_id = require_int("dataset_id", dataset_id_raw)
        weeks = require_int("weeks", weeks_raw)
        limit = require_int("limit", limit_raw)
    except ValueError as e:
        return json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            return jsonify(
                top_sellers(conn, dataset_id, category, weeks=weeks, limit=limit)
            )
        except AnalyticsError as e:
            return json_error(str(e), 400)


@bp.get("/api/v1/analytics/fluctuation")
def get_fluctuation():
    dataset_id_raw = request.args.get("dataset_id")
    item_id_raw = request.args.get("item_id")
    weeks_raw = request.args.get("weeks", "4")

    if not dataset_id_raw:
        return json_error("dataset_id is required", 400)
    if not item_id_raw:
        return json_error("item_id is required", 400)

    try:
        dataset_id = require_int("dataset_id", dataset_id_raw)
        item_id = require_int("item_id", item_id_raw)
        weeks = require_int("weeks", weeks_raw)
    except ValueError as e:
        return json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            return jsonify(fluctuation(conn, dataset_id, item_id, weeks=weeks))
        except AnalyticsError as e:
            return json_error(str(e), 400)
