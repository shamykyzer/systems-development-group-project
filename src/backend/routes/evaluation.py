from flask import Blueprint, current_app, jsonify, request

from db import connect
from services.evaluation import EvaluationError, run_evaluation


bp = Blueprint("evaluation", __name__)


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _require_int(name: str, raw) -> int:
    try:
        return int(raw)
    except Exception:  # noqa: BLE001
        raise ValueError(f"{name} must be an integer")


@bp.post("/api/v1/evaluation/run")
def evaluation_run():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return _json_error("JSON body must be an object", 400)

    if "dataset_id" not in data:
        return _json_error("dataset_id is required", 400)

    try:
        dataset_id = _require_int("dataset_id", data.get("dataset_id"))
        train_weeks = _require_int("train_weeks", data.get("train_weeks", 6))
        horizon_weeks = _require_int("horizon_weeks", data.get("horizon_weeks", 4))
    except ValueError as e:
        return _json_error(str(e), 400)

    algorithms = data.get("algorithms") or ["baseline"]
    if not isinstance(algorithms, list) or not algorithms:
        return _json_error("algorithms must be a non-empty list", 400)

    category = data.get("category")
    if category is not None:
        category = str(category).strip().lower()
        if category not in {"coffee", "food"}:
            return _json_error("category must be 'coffee' or 'food'", 400)

    item_ids = data.get("item_ids")
    if item_ids is not None:
        if not isinstance(item_ids, list) or not item_ids:
            return _json_error("item_ids must be a non-empty list when provided", 400)
        try:
            item_ids = [int(x) for x in item_ids]
        except Exception:  # noqa: BLE001
            return _json_error("item_ids must be integers", 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        try:
            result = run_evaluation(
                conn,
                dataset_id=dataset_id,
                algorithms=[str(a) for a in algorithms],
                train_weeks=train_weeks,
                horizon_weeks=horizon_weeks,
                category=category,
                item_ids=item_ids,
            )
            conn.commit()
            return jsonify({"success": True, "result": result})
        except EvaluationError as e:
            return _json_error(str(e), 400)


@bp.get("/api/v1/evaluation/results")
def evaluation_results():
    run_id_raw = request.args.get("run_id")
    if not run_id_raw:
        return _json_error("run_id is required", 400)
    try:
        run_id = _require_int("run_id", run_id_raw)
    except ValueError as e:
        return _json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        run = conn.execute(
            "SELECT id, dataset_id, algorithm, created_at, params_json FROM evaluation_runs WHERE id = ?",
            (run_id,),
        ).fetchone()
        if not run:
            return _json_error("unknown run_id", 404)

        rows = conn.execute(
            """
            SELECT
              m.item_id,
              i.name AS item_name,
              i.category AS item_category,
              m.metric_name,
              m.metric_value
            FROM evaluation_metrics m
            JOIN items i ON i.id = m.item_id
            WHERE m.evaluation_run_id = ?
            ORDER BY i.category, i.name, m.metric_name
            """,
            (run_id,),
        ).fetchall()

        # group metrics per item
        by_item = {}
        for r in rows:
            iid = int(r["item_id"])
            by_item.setdefault(
                iid,
                {"item_id": iid, "name": r["item_name"], "category": r["item_category"], "metrics": {}},
            )
            by_item[iid]["metrics"][r["metric_name"]] = float(r["metric_value"])

        return jsonify({"success": True, "run": dict(run), "results": list(by_item.values())})

