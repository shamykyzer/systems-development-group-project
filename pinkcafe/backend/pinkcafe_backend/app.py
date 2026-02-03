from flask import Flask
from flask_cors import CORS

from .config import Config
from .db import init_db
from .routes.analytics import bp as analytics_bp
from .routes.datasets import bp as datasets_bp
from .routes.health import bp as health_bp


def create_app(config: Config) -> Flask:
    app = Flask(__name__)
    app.config["ENV"] = config.env
    app.config["DEBUG"] = config.debug
    app.config["SECRET_KEY"] = config.secret_key

    # Enable CORS for local dev / React frontend. Configurable via env.
    CORS(app, resources={r"/*": {"origins": config.cors_origins}})

    # Ensure DB exists
    init_db(config.database_path)
    app.config["DATABASE_PATH"] = config.database_path

    # Routes
    app.register_blueprint(health_bp)
    app.register_blueprint(datasets_bp)
    app.register_blueprint(analytics_bp)

    return app

