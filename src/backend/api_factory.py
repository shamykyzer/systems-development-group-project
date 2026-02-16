import os
import sqlite3
from contextlib import closing

from flask import Flask, Response, abort, jsonify, request, send_from_directory
from flask_cors import CORS

from config import Config
from db import init_db
from routes.analytics import bp as analytics_bp
from routes.auth import bp as auth_bp
from routes.datasets import bp as datasets_bp
from routes.evaluation import bp as evaluation_bp
from routes.forecast import bp as forecast_bp
from routes.health import bp as health_bp
from routes.settings import bp as settings_bp
from status_marker import marker_path, read_marker


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

        @app.get("/")
        def _backend_status_page():
            # Lightweight HTML landing page for API-only mode.
            # (When a React build is present, "/" is handled above.)
            # Only show "Live" when core dependencies are OK (e.g. DB reachable).
            force_inactive = os.getenv("STATUS_FORCE_INACTIVE", "").strip().lower() in {
                "1",
                "true",
                "yes",
                "on",
            }

            ok = not force_inactive
            reason = None

            # Optional marker set by scripts (POST /api/v1/status/marker).
            marker_file = marker_path(config.database_path)

            if ok:
                try:
                    marker = read_marker(marker_file) or {}
                    if marker.get("inactive") is True:
                            ok = False
                            reason = marker.get("reason") or "test_failed"
                except Exception:
                    # If marker can't be read, ignore and fall back to DB check.
                    pass

            try:
                with closing(sqlite3.connect(config.database_path, timeout=1)) as conn:
                    conn.execute("SELECT 1")
            except Exception:
                ok = False
                reason = reason or "db_unreachable"

            html = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pink Cafe Backend</title>
    <style>
      /* Dark page */
      :root { color-scheme: dark; }
      html, body { height: 100%; }
      body {
        margin: 0;
        background: #000;
        color: #f9fafb;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }

      .wrap { min-height: 100%; display: grid; place-items: center; padding: 2rem; }
      .card {
        width: 100%;
        max-width: 760px;
        padding: 1.75rem;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px;
        background: rgba(17, 24, 39, .55);
        box-shadow: 0 20px 60px rgba(0,0,0,.65);
        backdrop-filter: blur(10px);
      }

      h1 {
        margin: 0 0 .85rem 0;
        font-size: 1.7rem;
        font-weight: 850;
        display: flex;
        align-items: center;
        gap: .75rem;
        flex-wrap: wrap;
        letter-spacing: .2px;
      }

      /* Fancy LIVE indicator */
      .live {
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        padding: .1rem .36rem;
        border-radius: 999px;
        border: 1px solid rgba(239, 68, 68, .55);
        background: rgba(239, 68, 68, .14);
        color: #fff;
        font-weight: 800;
        font-size: .6em; /* smaller than the title text */
        line-height: 1.2;
        user-select: none;
      }
      .live--inactive {
        border: 1px solid rgba(156, 163, 175, .55);
        background: rgba(156, 163, 175, .14);
        color: rgba(249,250,251,.78);
        filter: saturate(0.1);
      }
      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #ef4444;
        position: relative;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, .25);
      }
      .live-dot--inactive {
        background: #9ca3af;
        box-shadow: 0 0 0 2px rgba(156, 163, 175, .25);
      }
      .live-dot::after {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: 999px;
        border: 2px solid rgba(239, 68, 68, .65);
        opacity: .7;
        transform: scale(.4);
        animation: live-pulse 1.35s ease-out infinite;
      }
      .live-dot--inactive::after {
        content: none;
        animation: none;
      }
      @keyframes live-pulse {
        0% { transform: scale(.4); opacity: .75; }
        70% { transform: scale(1.4); opacity: 0; }
        100% { transform: scale(1.4); opacity: 0; }
      }

      p { margin: 0 0 .75rem 0; color: rgba(249,250,251,.86); }
      a { color: #93c5fd; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul { margin: .5rem 0 0 1.2rem; padding: 0; }
      li { margin: .25rem 0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>
          Pink Cafe Backend
          __STATUS_BADGE__
        </h1>
        <p>__STATUS_TEXT__</p>
      </div>
    </div>
  </body>
</html>
"""
            badge_html = (
                '<span class="live"><span class="live-dot" aria-hidden="true"></span>Live</span>'
                if ok
                else '<span class="live live--inactive"><span class="live-dot live-dot--inactive" aria-hidden="true"></span>Inactive</span>'
            )
            status_text = (
                "This container is running and serving the Flask API."
                if ok
                else (
                    "Backend is running, but marked inactive for UI testing."
                    if force_inactive
                    else (
                        "Backend is running, but a test has failed (status marker set)."
                        if reason == "test_failed"
                        else "Backend is running, but a dependency check failed (DB not reachable)."
                    )
                )
            )
            html = html.replace("__STATUS_BADGE__", badge_html).replace("__STATUS_TEXT__", status_text)
            return Response(
                html,
                status=200 if ok else 503,
                mimetype="text/html; charset=utf-8",
            )

    app.config["ENV"] = config.env
    app.config["DEBUG"] = config.debug
    app.config["SECRET_KEY"] = config.secret_key

    # UI testing helper: force API "down" while still serving the site.
    # When enabled, ALL /api* requests return 503 with a small JSON payload.
    api_force_down = os.getenv("API_FORCE_DOWN", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    # DB init control (useful for simulating DB failures without crashing at startup).
    skip_db_init = os.getenv("SKIP_DB_INIT", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    allow_db_startup_failure = os.getenv("ALLOW_DB_STARTUP_FAILURE", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    if api_force_down:

        @app.before_request
        def _force_api_down():
            if request.path.startswith("/api"):
                return (
                    jsonify(
                        {
                            "error": "backend_disabled",
                            "message": "Backend API is disabled for UI testing (API_FORCE_DOWN=true).",
                        }
                    ),
                    503,
                )

    # Enable CORS for local dev / React frontend. Configurable via env.
    CORS(app, resources={r"/*": {"origins": config.cors_origins}})

    # Ensure DB exists (unless explicitly skipped for testing)
    if skip_db_init:
        app.config["DB_INIT_SKIPPED"] = True
    else:
        try:
            init_db(config.database_path)
        except Exception as e:
            app.config["DB_INIT_ERROR"] = str(e)
            if not allow_db_startup_failure:
                raise

    app.config["DATABASE_PATH"] = config.database_path

    # Routes
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(datasets_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(evaluation_bp)
    app.register_blueprint(settings_bp)

    return app

