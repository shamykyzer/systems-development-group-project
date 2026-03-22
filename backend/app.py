"""
Pink Cafe Backend - Flask entrypoint.

Dev:        python app.py
Production: gunicorn app:app
"""

import os
from flask import Flask
from flask_cors import CORS
from db import init_db
from routes import register_routes

# --- Configuration (read from environment, with sensible defaults) ---
DEBUG        = os.getenv("FLASK_ENV", "development") == "development"
SECRET_KEY   = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join("data", "pinkcafe.db"))


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["DATABASE_PATH"] = DATABASE_PATH
    app.secret_key = SECRET_KEY

    # Allow cross-origin requests from the React frontend
    CORS(app, origins=CORS_ORIGINS)

    # Create DB tables if they don't exist yet (safe to run every startup)
    init_db(DATABASE_PATH)

    # Attach all API routes
    register_routes(app)

    # Security: add OWASP-recommended response headers to every reply
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self' data:;"
        )
        return response

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    print(f"Flask server starting on http://0.0.0.0:{port}")
    app.run(debug=DEBUG, host="0.0.0.0", port=port)

