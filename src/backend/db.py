import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from schema import SCHEMA_SQL


@contextmanager
def connect(db_path: str) -> Iterator[sqlite3.Connection]:
    # Ensure parent directory exists (e.g. default ./data/pinkcafe.db).
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        # Keep foreign key behavior consistent, even for direct connections.
        conn.execute("PRAGMA foreign_keys = ON;")
        yield conn
    finally:
        conn.close()


def init_db(db_path: str) -> None:
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.executescript(SCHEMA_SQL)
        conn.commit()

