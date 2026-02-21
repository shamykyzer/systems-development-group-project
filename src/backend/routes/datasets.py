import json
from typing import Dict, List, Tuple

from flask import Blueprint, current_app, jsonify, request

from db import connect
from services.csv_ingest import (
    CsvIngestError,
    normalize_number_sold_column,
    parse_wide_csv_bytes,
)


bp = Blueprint("datasets", __name__)


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _require_category(raw: str) -> str:
    cat = (raw or "").strip().lower()
    if cat not in {"coffee", "food"}:
        raise ValueError("category must be 'coffee' or 'food'")
    return cat


def _upsert_item_ids(conn, item_names: List[str], category: str) -> Dict[str, int]:
    cur = conn.cursor()
    out: Dict[str, int] = {}
    for name in item_names:
        cur.execute(
            "INSERT OR IGNORE INTO items (name, category) VALUES (?, ?)",
            (name, category),
        )
        cur.execute("SELECT id FROM items WHERE name = ?", (name,))
        row = cur.fetchone()
        out[name] = int(row["id"])
    return out


def _insert_sales_rows(
    conn,
    dataset_id: int,
    parsed_rows: List[Tuple[str, Dict[str, int]]],
    item_ids: Dict[str, int],
) -> int:
    cur = conn.cursor()
    sales: List[Tuple[int, str, int, int]] = []
    for date_iso, values in parsed_rows:
        for item_name, qty in values.items():
            sales.append((dataset_id, date_iso, item_ids[item_name], qty))
    cur.executemany(
        "INSERT INTO sales (dataset_id, date, item_id, quantity) VALUES (?, ?, ?, ?)",
        sales,
    )
    return len(sales)


@bp.get("/api/v1/datasets")
def list_datasets():
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        rows = conn.execute(
            "SELECT id, name, uploaded_at, source_filename, notes FROM datasets ORDER BY uploaded_at DESC"
        ).fetchall()
        return jsonify([dict(r) for r in rows])


@bp.post("/api/v1/datasets")
def create_dataset_and_ingest():
    """
    Multipart form endpoint.

    Fields:
      - file: CSV file
      - name: dataset name
      - category: 'coffee' | 'food' (applies to all item columns)
      - notes: optional text
      - item_categories: optional JSON mapping (reserved for future)
    """
    if "file" not in request.files:
        return _json_error("Missing file (multipart form field 'file')", 400)

    f = request.files["file"]
    if not f.filename:
        return _json_error("Missing filename", 400)

    name = (request.form.get("name") or f.filename).strip()
    notes = (request.form.get("notes") or "").strip() or None
    try:
        category = _require_category(request.form.get("category"))
    except ValueError as e:
        return _json_error(str(e), 400)

    # Reserved: accept but ignore for now (keeps API forward compatible)
    _ = request.form.get("item_categories")
    if _:
        try:
            json.loads(_)
        except Exception:  # noqa: BLE001
            return _json_error("item_categories must be valid JSON if provided", 400)

    raw = f.read()
    try:
        parsed = parse_wide_csv_bytes(raw)
        parsed = normalize_number_sold_column(parsed, f.filename)
    except CsvIngestError as e:
        return _json_error(str(e), 400)

    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO datasets (name, source_filename, notes) VALUES (?, ?, ?)",
            (name, f.filename, notes),
        )
        dataset_id = int(cur.lastrowid)

        item_ids = _upsert_item_ids(conn, parsed.item_names, category)
        sales_count = _insert_sales_rows(conn, dataset_id, parsed.rows, item_ids)

        conn.commit()

    return (
        jsonify(
            {
                "success": True,
                "dataset": {
                    "id": dataset_id,
                    "name": name,
                    "source_filename": f.filename,
                    "category": category,
                    "items": parsed.item_names,
                },
                "inserted_sales_rows": sales_count,
            }
        ),
        201,
    )
