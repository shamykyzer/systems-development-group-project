from flask import Blueprint, jsonify


bp = Blueprint("health", __name__)


@bp.get("/")
def home():
    return jsonify({"message": "Pink Cafe Backend API", "status": "running"})


@bp.get("/api/v1/health")
def health():
    return jsonify({"ok": True})

