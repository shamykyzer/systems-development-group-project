import csv
import io
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Tuple


_DDMMYYYY = re.compile(r"^\d{2}/\d{2}/\d{4}$")


class CsvIngestError(ValueError):
    pass


@dataclass(frozen=True)
class ParsedWideCsv:
    """
    Normalized representation of a wide CSV file:
      - dates as ISO yyyy-mm-dd strings
      - columns are item names
      - values are non-negative ints
    """

    item_names: List[str]
    rows: List[Tuple[str, Dict[str, int]]]


def _parse_ddmmyyyy(s: str) -> str:
    s = (s or "").strip()
    if not _DDMMYYYY.match(s):
        raise CsvIngestError(f"Invalid date format (expected DD/MM/YYYY): {s!r}")
    dt = datetime.strptime(s, "%d/%m/%Y")
    return dt.strftime("%Y-%m-%d")


def _clean_header_cell(cell: str) -> str:
    cell = (cell or "").strip()
    cell = re.sub(r"\s+", " ", cell)
    return cell


def _parse_int(cell: str) -> int:
    cell = (cell or "").strip()
    if cell == "":
        raise CsvIngestError("Empty quantity cell")
    try:
        v = int(float(cell))  # tolerate "12.0"
    except Exception as e:  # noqa: BLE001
        raise CsvIngestError(f"Invalid quantity: {cell!r}") from e
    if v < 0:
        raise CsvIngestError(f"Quantity must be >= 0, got {v}")
    return v


def parse_wide_csv_bytes(raw: bytes) -> ParsedWideCsv:
    """
    Supports:
    - Normal header: Date,Cappuccino,Americano
    - Two-row header variant:
        Date,Number Sold,
        ,Cappuccino,Americano
    - Single-item food format:
        Date,Number Sold
        01/03/2025,82
      Item name will be inferred later (from filename) or mapped by caller.
    """
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        # fall back
        text = raw.decode("latin-1")

    # Use csv module to avoid pandas/multiindex edge cases and keep behavior predictable.
    reader = csv.reader(io.StringIO(text))
    rows = [r for r in reader if any((c or "").strip() for c in r)]
    if len(rows) < 2:
        raise CsvIngestError("CSV must have a header row and at least one data row")

    header1 = [_clean_header_cell(c) for c in rows[0]]
    header2 = None

    # Detect two-row header: first row contains 'Number Sold' and second row has blank first cell.
    if len(rows) >= 3:
        maybe = [_clean_header_cell(c) for c in rows[1]]
        if header1 and header1[0].lower() == "date" and (maybe and maybe[0] == "") and (
            any(h.lower() in {"cappuccino", "americano"} for h in maybe[1:])
            or "number sold" in " ".join(h.lower() for h in header1)
        ):
            header2 = maybe

    if header2 is not None:
        # Build columns from second row (skip first date column)
        item_names = [h for h in header2[1:] if h and not h.lower().startswith("unnamed")]
        data_start_idx = 2
    else:
        if not header1 or header1[0].lower() != "date":
            raise CsvIngestError("First column must be 'Date'")
        item_names = [h for h in header1[1:] if h and not h.lower().startswith("unnamed")]
        data_start_idx = 1

    if not item_names:
        raise CsvIngestError("No item columns found (expected at least one column after Date)")

    parsed_rows: List[Tuple[str, Dict[str, int]]] = []
    for r in rows[data_start_idx:]:
        if not r:
            continue
        date_iso = _parse_ddmmyyyy(r[0] if len(r) > 0 else "")
        values: Dict[str, int] = {}
        for idx, item in enumerate(item_names, start=1):
            cell = r[idx] if idx < len(r) else ""
            values[item] = _parse_int(cell)
        parsed_rows.append((date_iso, values))

    if not parsed_rows:
        raise CsvIngestError("CSV contains no data rows")

    return ParsedWideCsv(item_names=item_names, rows=parsed_rows)


def infer_single_item_name_from_filename(filename: str) -> str:
    """
    For food CSVs like 'Pink CroissantSales March - Oct 2025.csv' where the only item column is
    'Number Sold', infer the item name from the filename.
    """
    base = (filename or "item").strip()
    base = re.sub(r"\.csv$", "", base, flags=re.IGNORECASE)
    base = base.replace("Pink ", "")
    # e.g. "CroissantSales March - Oct 2025" -> "Croissant"
    base = re.sub(r"Sales.*$", "", base, flags=re.IGNORECASE).strip()
    return base or "item"


def normalize_number_sold_column(parsed: ParsedWideCsv, filename: str) -> ParsedWideCsv:
    """
    If the CSV had a single item called 'Number Sold', replace it with an inferred item name.
    """
    if len(parsed.item_names) == 1 and parsed.item_names[0].lower() == "number sold":
        item = infer_single_item_name_from_filename(filename)
        new_rows = []
        for date_iso, values in parsed.rows:
            new_rows.append((date_iso, {item: values[parsed.item_names[0]]}))
        return ParsedWideCsv(item_names=[item], rows=new_rows)
    return parsed

