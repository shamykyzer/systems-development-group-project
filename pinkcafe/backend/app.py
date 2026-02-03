"""
Entrypoint for running the backend with `python app.py` (local or Docker).

The implementation lives in the `pinkcafe_backend` package; this file stays
thin to preserve existing run commands (e.g. docker-compose `command: python app.py`).
"""

from pinkcafe_backend.app import create_app
from pinkcafe_backend.config import load_config


config = load_config()
app = create_app(config)

if __name__ == '__main__':
    print("\nFlask server starting on http://0.0.0.0:5000")
    app.run(debug=config.debug, host='0.0.0.0', port=5000)
