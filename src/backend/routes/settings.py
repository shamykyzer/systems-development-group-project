from flask import Blueprint, current_app, jsonify, request
import sqlite3
from db import connect

bp = Blueprint("settings", __name__)


@bp.route('/api/prophet/presets', methods=['GET'])
def get_presets():
    """Get all Prophet presets"""
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        presets = conn.execute('SELECT * FROM prophet_presets ORDER BY preset_name').fetchall()
        return jsonify([dict(preset) for preset in presets])

@bp.route('/api/prophet/presets/<preset_name>', methods=['GET'])
def get_preset(preset_name):
    """Get a specific Prophet preset by name"""
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        preset = conn.execute(
            'SELECT * FROM prophet_presets WHERE preset_name = ?',
            (preset_name,)
        ).fetchone()
        
        if preset:
            return jsonify(dict(preset))
        else:
            return jsonify({"error": "Preset not found"}), 404

@bp.route('/api/prophet/presets', methods=['POST'])
def create_preset():
    """Create a new Prophet preset"""
    data = request.get_json()
    preset_name = data.get('preset_name')
    
    if not preset_name:
        return jsonify({"error": "preset_name is required"}), 400
    
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    try:
        with connect(db_path) as conn:
            conn.execute('''
                INSERT INTO prophet_presets (
                    preset_name, growth, changepoint_prior_scale, seasonality_prior_scale,
                    seasonality_mode, daily_seasonality, weekly_seasonality, yearly_seasonality,
                    forecast_periods, floor_multiplier, cap_multiplier, custom_seasonality_enabled,
                    custom_seasonality_name, custom_seasonality_period, custom_seasonality_fourier_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                preset_name,
                data.get('growth', 'linear'),
                data.get('changepoint_prior_scale', 0.05),
                data.get('seasonality_prior_scale', 10.0),
                data.get('seasonality_mode', 'multiplicative'),
                1 if data.get('daily_seasonality', False) else 0,
                1 if data.get('weekly_seasonality', True) else 0,
                1 if data.get('yearly_seasonality', True) else 0,
                data.get('forecast_periods', 365),
                data.get('floor_multiplier', 0.5),
                data.get('cap_multiplier', 1.5),
                1 if data.get('custom_seasonality_enabled', False) else 0,
                data.get('custom_seasonality_name', ''),
                data.get('custom_seasonality_period', 30.5),
                data.get('custom_seasonality_fourier_order', 3)
            ))
            conn.commit()
        return jsonify({"message": f"Preset '{preset_name}' created successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Preset name already exists"}), 400

@bp.route('/api/prophet/presets/<preset_name>', methods=['PUT'])
def update_preset(preset_name):
    """Update an existing Prophet preset"""
    data = request.get_json()
    
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        existing = conn.execute(
            'SELECT * FROM prophet_presets WHERE preset_name = ?',
            (preset_name,)
        ).fetchone()
        
        if not existing:
            return jsonify({"error": "Preset not found"}), 404
        
        conn.execute('''
            UPDATE prophet_presets SET
                growth = ?,
                changepoint_prior_scale = ?,
                seasonality_prior_scale = ?,
                seasonality_mode = ?,
                daily_seasonality = ?,
                weekly_seasonality = ?,
                yearly_seasonality = ?,
                forecast_periods = ?,
                floor_multiplier = ?,
                cap_multiplier = ?,
                custom_seasonality_enabled = ?,
                custom_seasonality_name = ?,
                custom_seasonality_period = ?,
                custom_seasonality_fourier_order = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE preset_name = ?
        ''', (
            data.get('growth', 'linear'),
            data.get('changepoint_prior_scale', 0.05),
            data.get('seasonality_prior_scale', 10.0),
            data.get('seasonality_mode', 'multiplicative'),
            1 if data.get('daily_seasonality', False) else 0,
            1 if data.get('weekly_seasonality', True) else 0,
            1 if data.get('yearly_seasonality', True) else 0,
            data.get('forecast_periods', 365),
            data.get('floor_multiplier', 0.5),
            data.get('cap_multiplier', 1.5),
            1 if data.get('custom_seasonality_enabled', False) else 0,
            data.get('custom_seasonality_name', ''),
            data.get('custom_seasonality_period', 30.5),
            data.get('custom_seasonality_fourier_order', 3),
            preset_name
        ))
        conn.commit()
        
        return jsonify({"message": f"Preset '{preset_name}' updated successfully"})

@bp.route('/api/prophet/presets/<preset_name>', methods=['DELETE'])
def delete_preset(preset_name):
    """Delete a Prophet preset"""
    db_path = current_app.config.get("DATABASE_PATH", "data/pinkcafe.db")
    with connect(db_path) as conn:
        result = conn.execute(
            'DELETE FROM prophet_presets WHERE preset_name = ?',
            (preset_name,)
        )
        conn.commit()
        
        if result.rowcount > 0:
            return jsonify({"message": f"Preset '{preset_name}' deleted successfully"})
        else:
            return jsonify({"error": "Preset not found"}), 404