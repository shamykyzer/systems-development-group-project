"""
Local helper to import a wide-format CSV into the normalized backend schema.

This script is intentionally small and reuses the same parsing logic as the API:
- `services/csv_ingest.py` for robust wide-CSV parsing/normalization
- `db` for the normalized SQLite schema

Example:
  python3 scripts/csv_import.py \
    --csv CSV_Files/"Pink CoffeeSales March - Oct 2025.csv" \
    --category coffee \
    --name coffee-sample
"""

from __future__ import annotations

import argparse
from pathlib import Path
from db import connect, init_db
from services.csv_ingest import (
    CsvIngestError,
    normalize_number_sold_column,
    parse_wide_csv_bytes,
)
from services.dataset_ingest import insert_sales_rows, upsert_item_ids


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

        item_ids = upsert_item_ids(conn, parsed.item_names, args.category)
        sales_count = insert_sales_rows(conn, dataset_id, parsed.rows, item_ids)
        conn.commit()

        print("Import complete:")
        print(f"- db: {args.db}")
        print(f"- dataset_id: {dataset_id}")
        print(f"- items: {len(parsed.item_names)}")
        print(f"- inserted sales rows: {sales_count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
