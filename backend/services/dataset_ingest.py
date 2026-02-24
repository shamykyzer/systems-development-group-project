"""Shared dataset ingestion logic for API routes and CLI scripts."""

from typing import Dict, List, Tuple


def upsert_item_ids(conn, item_names: List[str], category: str) -> Dict[str, int]:
    """Insert or get item IDs; return mapping of item_name -> id."""
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


def insert_sales_rows(
    conn,
    dataset_id: int,
    parsed_rows: List[Tuple[str, Dict[str, int]]],
    item_ids: Dict[str, int],
) -> int:
    """Insert sales rows; return count inserted."""
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
