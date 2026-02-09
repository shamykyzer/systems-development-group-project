import os

from flask import Flask, abort, send_from_directory
from flask_cors import CORS

from config import Config
from db import init_db
from routes.analytics import bp as analytics_bp
from routes.auth import bp as auth_bp
from routes.datasets import bp as datasets_bp
from routes.evaluation import bp as evaluation_bp
from routes.forecast import bp as forecast_bp
from routes.health import bp as health_bp


def create_app(config: Config) -> Flask:
    # If a React build is present, serve it from the backend container.
    # This enables a single-image deploy (Flask API + static frontend).
    frontend_dir = os.getenv("FRONTEND_DIR")
    if frontend_dir and os.path.exists(os.path.join(frontend_dir, "index.html")):
        app = Flask(__name__, static_folder=frontend_dir, static_url_path="")

        @app.get("/")
        def _frontend_index():
            return send_from_directory(frontend_dir, "index.html")

        @app.get("/<path:path>")
        def _frontend_assets(path: str):
            # Never swallow API routes; let Flask return 404 if an API path doesn't exist.
            if path.startswith("api/"):
                abort(404)

            candidate = os.path.join(frontend_dir, path)
            if os.path.exists(candidate):
                return send_from_directory(frontend_dir, path)

            # SPA fallback (React Router)
            return send_from_directory(frontend_dir, "index.html")
    else:
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
    app.register_blueprint(auth_bp)
    app.register_blueprint(datasets_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(evaluation_bp)

    return app

