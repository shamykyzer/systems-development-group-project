import os
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
    debug = os.getenv("FLASK_DEBUG", "").lower() in {"1", "true", "yes"} or env == "development"
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

    cors_origins = os.getenv("CORS_ORIGINS", "*")

    # Default to a local ./data/ folder so Docker volume mounts can persist it easily.
    database_path = os.getenv("DATABASE_PATH", os.path.join("data", "pinkcafe.db"))

    return Config(
        env=env,
        debug=debug,
        secret_key=secret_key,
        cors_origins=cors_origins,
        database_path=database_path,
    )

