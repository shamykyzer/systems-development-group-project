import os
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    # Flask
    env: str
    debug: bool
    secret_key: str

    # CORS
    cors_origins: str

    # DB
    database_path: str


def load_config() -> Config:
    env = os.getenv("FLASK_ENV", os.getenv("ENV", "development"))
    debug = (
        os.getenv("FLASK_DEBUG", "").lower() in {"1", "true", "yes"}
        or env == "development"
    )
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

    cors_origins = os.getenv("CORS_ORIGINS", "*")

    # Default to backend/data/pinkcafe.db (relative to this package), not CWD.
    # This prevents creating src/backend/data when run from wrong directory.
    _backend_dir = os.path.dirname(os.path.abspath(__file__))
    _default_db = os.path.join(_backend_dir, "data", "pinkcafe.db")
    database_path = os.getenv("DATABASE_PATH", _default_db)

    # Debug: trace path resolution to find what creates src/backend/data
    print(
        f"[config] __file__={__file__!r} cwd={os.getcwd()!r} "
        f"database_path={database_path!r}",
        file=sys.stderr,
    )

    return Config(
        env=env,
        debug=debug,
        secret_key=secret_key,
        cors_origins=cors_origins,
        database_path=database_path,
    )
