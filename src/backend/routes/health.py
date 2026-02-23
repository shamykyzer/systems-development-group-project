import os
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from status_marker import clear_marker, marker_path, write_marker


bp = Blueprint("health", __name__)


@bp.get("/api")
def api_home():
    return jsonify({"message": "Pink Cafe Backend API", "status": "running"})


def _status_marker_path() -> str:
    db_path = current_app.config.get(
        "DATABASE_PATH", os.path.join("data", "pinkcafe.db")
    )
    return marker_path(db_path)


@bp.post("/api/v1/status/marker")
def set_status_marker():
    """
    Used by test scripts to mark the backend as "inactive" on the status page.
    """
    payload = request.get_json(silent=True) or {}
    inactive = bool(payload.get("inactive", True))

    path = _status_marker_path()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    if not inactive:
        clear_marker(path)
        return ("", 204)

    marker = {
        "inactive": True,
        "reason": payload.get("reason") or "test_failed",
        "source": payload.get("source") or "unknown",
        "exit_code": payload.get("exit_code"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    write_marker(path, marker)

    return jsonify({"ok": True, "marker_path": path, "marker": marker})


@bp.delete("/api/v1/status/marker")
def clear_status_marker():
    """
    Clears any test-failure marker file.
    """
    path = _status_marker_path()
    clear_marker(path)
    return ("", 204)
