from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


class AnalyticsError(ValueError):
    pass


def _parse_iso_date(s: str) -> date:
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception as e:  # noqa: BLE001
        raise AnalyticsError(f"Invalid ISO date in DB: {s!r}") from e


def _window_start_end(end_date_iso: str, weeks: int) -> tuple[str, str]:
    if weeks <= 0:
        raise AnalyticsError("weeks must be > 0")
    end_d = _parse_iso_date(end_date_iso)
    start_d = end_d - timedelta(days=weeks * 7 - 1)
    return start_d.strftime("%Y-%m-%d"), end_d.strftime("%Y-%m-%d")


def get_dataset_end_date(conn, dataset_id: int) -> Optional[str]:
    row = conn.execute(
        "SELECT MAX(date) AS end_date FROM sales WHERE dataset_id = ?", (dataset_id,)
    ).fetchone()
    if not row or row["end_date"] is None:
        return None
    return str(row["end_date"])


def list_items_for_dataset(
    conn, dataset_id: int, category: Optional[str] = None
) -> List[Dict[str, Any]]:
    if category is None:
        rows = conn.execute(
            """
            SELECT DISTINCT i.id, i.name, i.category
            FROM items i
            JOIN sales s ON s.item_id = i.id
            WHERE s.dataset_id = ?
            ORDER BY i.category, i.name
            """,
            (dataset_id,),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT DISTINCT i.id, i.name, i.category
            FROM items i
            JOIN sales s ON s.item_id = i.id
            WHERE s.dataset_id = ? AND i.category = ?
            ORDER BY i.name
            """,
            (dataset_id, category),
        ).fetchall()
    return [dict(r) for r in rows]


def top_sellers(
    conn,
    dataset_id: int,
    category: str,
    weeks: int = 4,
    limit: int = 3,
) -> Dict[str, Any]:
    end_date_iso = get_dataset_end_date(conn, dataset_id)
    if end_date_iso is None:
        raise AnalyticsError("dataset has no sales data")

    start_iso, end_iso = _window_start_end(end_date_iso, weeks)

    rows = conn.execute(
        """
        SELECT
          i.id AS item_id,
          i.name AS item_name,
          i.category AS category,
          SUM(s.quantity) AS total_quantity
        FROM sales s
        JOIN items i ON i.id = s.item_id
        WHERE
          s.dataset_id = ?
          AND i.category = ?
          AND s.date BETWEEN ? AND ?
        GROUP BY i.id, i.name, i.category
        ORDER BY total_quantity DESC, i.name ASC
        LIMIT ?
        """,
        (dataset_id, category, start_iso, end_iso, limit),
    ).fetchall()

    return {
        "dataset_id": dataset_id,
        "category": category,
        "weeks": weeks,
        "window": {"start_date": start_iso, "end_date": end_iso},
        "top_sellers": [dict(r) for r in rows],
    }


def fluctuation(
    conn,
    dataset_id: int,
    item_id: int,
    weeks: int = 4,
) -> Dict[str, Any]:
    end_date_iso = get_dataset_end_date(conn, dataset_id)
    if end_date_iso is None:
        raise AnalyticsError("dataset has no sales data")

    start_iso, end_iso = _window_start_end(end_date_iso, weeks)

    item = conn.execute(
        "SELECT id, name, category FROM items WHERE id = ?", (item_id,)
    ).fetchone()
    if not item:
        raise AnalyticsError("unknown item_id")

    rows = conn.execute(
        """
        SELECT s.date AS date, SUM(s.quantity) AS quantity
        FROM sales s
        WHERE s.dataset_id = ? AND s.item_id = ? AND s.date BETWEEN ? AND ?
        GROUP BY s.date
        ORDER BY s.date ASC
        """,
        (dataset_id, item_id, start_iso, end_iso),
    ).fetchall()

    # Ensure we return a continuous daily series (fill missing dates with 0)
    start_d = _parse_iso_date(start_iso)
    end_d = _parse_iso_date(end_iso)
    by_date = {str(r["date"]): int(r["quantity"]) for r in rows}
    series = []
    d = start_d
    while d <= end_d:
        iso = d.strftime("%Y-%m-%d")
        series.append({"date": iso, "quantity": by_date.get(iso, 0)})
        d += timedelta(days=1)

    return {
        "dataset_id": dataset_id,
        "item": {
            "id": int(item["id"]),
            "name": item["name"],
            "category": item["category"],
        },
        "weeks": weeks,
        "window": {"start_date": start_iso, "end_date": end_iso},
        "series": series,
    }
