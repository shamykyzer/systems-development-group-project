import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from db.schema import SCHEMA_SQL


@contextmanager
def connect(db_path: str) -> Iterator[sqlite3.Connection]:
    # Ensure parent directory exists (e.g. default ./data/pinkcafe.db).
    parent = Path(db_path).parent
    parent.mkdir(parents=True, exist_ok=True)
    if "src" in str(parent):
        import sys
        print(f"[connection] mkdir parent={parent} db_path={db_path}", file=sys.stderr)
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        # Keep foreign key behavior consistent, even for direct connections.
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA cache_size=-64000;")  # 64MB
        yield conn
    finally:
        conn.close()


def init_db(db_path: str) -> None:
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.executescript(SCHEMA_SQL)
        conn.commit()
