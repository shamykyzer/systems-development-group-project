"""Load Facebook Prophet library, avoiding shadowing by our 'prophet' package."""
import os
import sys


def _get_prophet_class():
    our_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(our_dir)
    saved_prophet = sys.modules.pop("prophet", None)
    paths_to_move = [p for p in sys.path if p and backend_dir in os.path.abspath(p)]
    for p in paths_to_move:
        sys.path.remove(p)
    try:
        from prophet import Prophet  # noqa: F401
        return Prophet
    finally:
        for p in paths_to_move:
            sys.path.append(p)
        if saved_prophet is not None:
            sys.modules["prophet"] = saved_prophet


Prophet = _get_prophet_class()
