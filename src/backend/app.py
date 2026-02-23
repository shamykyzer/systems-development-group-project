"""
Backend entrypoint + WSGI application.

- Dev: `python3 app.py`
- WSGI: `gunicorn app:app`
"""

from config import load_config

from api_factory import create_app

import os

config = load_config()
app = create_app(config)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    print(f"\nFlask server starting on http://0.0.0.0:{port}")
    app.run(debug=config.debug, host="0.0.0.0", port=port)
