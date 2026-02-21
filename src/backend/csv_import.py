"""
Local helper to import a wide-format CSV into the normalized backend schema.

This script is intentionally small and reuses the same parsing logic as the API:
- `services/csv_ingest.py` for robust wide-CSV parsing/normalization
- `db.py` / `schema.py` for the normalized SQLite schema

Example:
  python3 csv_import.py \
    --csv CSV_Files/"Pink CoffeeSales March - Oct 2025.csv" \
    --category coffee \
    --name coffee-sample
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, List, Tuple

from db import connect, init_db
from services.csv_ingest import (
    CsvIngestError,
    normalize_number_sold_column,
    parse_wide_csv_bytes,
)


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
    sales = []
    for date_iso, values in parsed_rows:
        for item_name, qty in values.items():
            sales.append((dataset_id, date_iso, item_ids[item_name], qty))
    cur.executemany(
        "INSERT INTO sales (dataset_id, date, item_id, quantity) VALUES (?, ?, ?, ?)",
        sales,
    )
    return len(sales)


def main() -> int:
    p = argparse.ArgumentParser(
        description="Import a wide CSV into the Pink Cafe normalized SQLite schema"
    )
    p.add_argument(
        "--db",
        default="data/pinkcafe.db",
        help="SQLite DB path (default: data/pinkcafe.db)",
    )
    p.add_argument("--csv", required=True, help="Path to CSV to ingest")
    p.add_argument(
        "--category",
        required=True,
        choices=["coffee", "food"],
        help="Category applied to item columns",
    )
    p.add_argument(
        "--name", default=None, help="Dataset name (defaults to CSV filename)"
    )
    p.add_argument("--notes", default=None, help="Optional notes for datasets table")
    args = p.parse_args()

    init_db(args.db)

    try:
        with open(args.csv, "rb") as f:
            raw = f.read()
    except OSError as e:
        print(f"Failed to read CSV: {args.csv}\n{e}")
        return 1

    filename = Path(args.csv).name
    dataset_name = (args.name or filename).strip()

    try:
        parsed = parse_wide_csv_bytes(raw)
        parsed = normalize_number_sold_column(parsed, filename)
    except CsvIngestError as e:
        print(f"CSV parse failed: {e}")
        return 2

    with connect(args.db) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO datasets (name, source_filename, notes) VALUES (?, ?, ?)",
            (dataset_name, filename, args.notes),
        )
        dataset_id = int(cur.lastrowid)

        item_ids = _upsert_item_ids(conn, parsed.item_names, args.category)
        sales_count = _insert_sales_rows(conn, dataset_id, parsed.rows, item_ids)
        conn.commit()

        print("Import complete:")
        print(f"- db: {args.db}")
        print(f"- dataset_id: {dataset_id}")
        print(f"- items: {len(parsed.item_names)}")
        print(f"- inserted sales rows: {sales_count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
