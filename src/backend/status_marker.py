import json
import os
from typing import Any, Dict, Optional


def marker_path(database_path: str) -> str:
    """
    Returns the filesystem path for the status marker file.
    - If STATUS_MARKER_FILE is set, uses it.
    - Otherwise stores next to the SQLite DB, so Docker volumes persist it.
    """
    explicit = os.getenv("STATUS_MARKER_FILE", "").strip()
    if explicit:
        return explicit

    db_dir = os.path.dirname(database_path) or "data"
    return os.path.join(db_dir, "status_marker.json")


def read_marker(path: str) -> Optional[Dict[str, Any]]:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f) or {}
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def write_marker(path: str, marker: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(marker, f)


def clear_marker(path: str) -> None:
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
