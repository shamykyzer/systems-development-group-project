from flask import Blueprint, current_app, jsonify, request

from db import connect
from services.analytics import (
    AnalyticsError,
    fluctuation,
    list_items_for_dataset,
    top_sellers,
)


bp = Blueprint("analytics", __name__)


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _require_int(name: str, raw: str) -> int:
    try:
        return int(raw)
    except Exception:  # noqa: BLE001
        raise ValueError(f"{name} must be an integer")


@bp.get("/api/v1/items")
def list_items():
    dataset_id_raw = request.args.get("dataset_id")
    if not dataset_id_raw:
        return _json_error("dataset_id is required", 400)
    try:
        dataset_id = _require_int("dataset_id", dataset_id_raw)
    except ValueError as e:
        return _json_error(str(e), 400)

    category = request.args.get("category")
    if category is not None:
        category = category.strip().lower()
        if category not in {"coffee", "food"}:
            return _json_error("category must be 'coffee' or 'food'", 400)

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
        return _json_error("dataset_id is required", 400)
    if category not in {"coffee", "food"}:
        return _json_error("category must be 'coffee' or 'food'", 400)

    try:
        dataset_id = _require_int("dataset_id", dataset_id_raw)
        weeks = _require_int("weeks", weeks_raw)
        limit = _require_int("limit", limit_raw)
    except ValueError as e:
        return _json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            return jsonify(
                top_sellers(conn, dataset_id, category, weeks=weeks, limit=limit)
            )
        except AnalyticsError as e:
            return _json_error(str(e), 400)


@bp.get("/api/v1/analytics/fluctuation")
def get_fluctuation():
    dataset_id_raw = request.args.get("dataset_id")
    item_id_raw = request.args.get("item_id")
    weeks_raw = request.args.get("weeks", "4")

    if not dataset_id_raw:
        return _json_error("dataset_id is required", 400)
    if not item_id_raw:
        return _json_error("item_id is required", 400)

    try:
        dataset_id = _require_int("dataset_id", dataset_id_raw)
        item_id = _require_int("item_id", item_id_raw)
        weeks = _require_int("weeks", weeks_raw)
    except ValueError as e:
        return _json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            return jsonify(fluctuation(conn, dataset_id, item_id, weeks=weeks))
        except AnalyticsError as e:
            return _json_error(str(e), 400)
