import sqlite3
from contextlib import contextmanager
from typing import Iterator

from .schema import SCHEMA_SQL


@contextmanager
def connect(db_path: str) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        conn.close()


def init_db(db_path: str) -> None:
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.executescript(SCHEMA_SQL)
        conn.commit()

