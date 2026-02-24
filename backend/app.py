"""
Backend entrypoint + WSGI application.

- Dev: `python3 app.py`
- WSGI: `gunicorn app:app`
"""
import os
import sys

# Ensure backend dir is first in path so local prophet/ overrides pip prophet
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from config import load_config

from api_factory import create_app

config = load_config()
app = create_app(config)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    print(f"\nFlask server starting on http://0.0.0.0:{port}")
    app.run(debug=config.debug, host="0.0.0.0", port=port)
