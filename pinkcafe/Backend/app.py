from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Database configuration
DATABASE = 'pinkcafe.db'

def get_db_connection():
    """Create a database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    """Initialize the database with tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create coffee_sales table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coffee_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            cappuccino INTEGER NOT NULL,
            americano INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create prophet_presets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prophet_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preset_name TEXT UNIQUE NOT NULL,
            growth TEXT NOT NULL,
            changepoint_prior_scale REAL NOT NULL,
            seasonality_prior_scale REAL NOT NULL,
            seasonality_mode TEXT NOT NULL,
            daily_seasonality INTEGER NOT NULL,
            weekly_seasonality INTEGER NOT NULL,
            yearly_seasonality INTEGER NOT NULL,
            forecast_periods INTEGER NOT NULL,
            floor_multiplier REAL NOT NULL,
            cap_multiplier REAL NOT NULL,
            custom_seasonality_enabled INTEGER NOT NULL,
            custom_seasonality_name TEXT,
            custom_seasonality_period REAL,
            custom_seasonality_fourier_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add default preset if it doesn't exist
    try:
        cursor.execute('''
            INSERT INTO prophet_presets (
                preset_name, growth, changepoint_prior_scale, seasonality_prior_scale,
                seasonality_mode, daily_seasonality, weekly_seasonality, yearly_seasonality,
                forecast_periods, floor_multiplier, cap_multiplier, custom_seasonality_enabled,
                custom_seasonality_name, custom_seasonality_period, custom_seasonality_fourier_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('Default', 'linear', 0.05, 10.0, 'multiplicative', 0, 1, 1, 365, 0.5, 1.5, 0, '', 30.5, 3))
        print("Default preset created")
    except sqlite3.IntegrityError:
        print("Default preset already exists")
    
    
    # Add a test user (email: admin@pinkcafe.com, password: admin123)
    try:
        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ('admin', 'admin@pinkcafe.com', hash_password('admin123'))
        )
        print("Test user created: admin@pinkcafe.com / admin123")
    except sqlite3.IntegrityError:
        print("Test user already exists")
    
    conn.commit()
    conn.close()

@app.route('/')
def home():
    return jsonify({"message": "Pink Cafe Backend API", "status": "running"})

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400
    
    # Hash the password to compare
    hashed_password = hash_password(password)
    
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        (email, hashed_password)
    ).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email']
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

@app.route('/api/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({
            "success": False,
            "message": "All fields are required"
        }), 400
    
    # Hash the password
    hashed_password = hash_password(password)
    
    try:
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, hashed_password)
        )
        conn.commit()
        conn.close()
        return jsonify({
            "success": True,
            "message": "User registered successfully"
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({
            "success": False,
            "message": "Username or email already exists"
        }), 400

@app.route('/api/sales', methods=['GET'])
def get_sales():
    """Get all sales records"""
    conn = get_db_connection()
    sales = conn.execute('SELECT * FROM coffee_sales ORDER BY date DESC').fetchall()
    conn.close()
    
    return jsonify([dict(sale) for sale in sales])

@app.route('/api/sales/summary', methods=['GET'])
def get_sales_summary():
    """Get sales summary statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total_days,
            SUM(cappuccino) as total_cappuccino,
            SUM(americano) as total_americano,
            AVG(cappuccino) as avg_cappuccino,
            AVG(americano) as avg_americano,
            MIN(date) as start_date,
            MAX(date) as end_date
        FROM coffee_sales
    ''')
    stats = cursor.fetchone()
    conn.close()
    
    return jsonify({
        "total_days": stats[0],
        "total_cappuccino": stats[1],
        "total_americano": stats[2],
        "avg_cappuccino": round(stats[3], 2) if stats[3] else 0,
        "avg_americano": round(stats[4], 2) if stats[4] else 0,
        "start_date": stats[5],
        "end_date": stats[6]
    })

@app.route('/api/prophet/presets', methods=['GET'])
def get_presets():
    """Get all Prophet presets"""
    conn = get_db_connection()
    presets = conn.execute('SELECT * FROM prophet_presets ORDER BY preset_name').fetchall()
    conn.close()
    
    return jsonify([dict(preset) for preset in presets])

@app.route('/api/prophet/presets/<preset_name>', methods=['GET'])
def get_preset(preset_name):
    """Get a specific Prophet preset by name"""
    conn = get_db_connection()
    preset = conn.execute(
        'SELECT * FROM prophet_presets WHERE preset_name = ?',
        (preset_name,)
    ).fetchone()
    conn.close()
    
    if preset:
        return jsonify(dict(preset))
    else:
        return jsonify({"error": "Preset not found"}), 404

@app.route('/api/prophet/presets', methods=['POST'])
def create_preset():
    """Create a new Prophet preset"""
    data = request.get_json()
    preset_name = data.get('preset_name')
    
    if not preset_name:
        return jsonify({"error": "preset_name is required"}), 400
    
    try:
        conn = get_db_connection()
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
        conn.close()
        return jsonify({"message": f"Preset '{preset_name}' created successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Preset name already exists"}), 400

@app.route('/api/prophet/presets/<preset_name>', methods=['PUT'])
def update_preset(preset_name):
    """Update an existing Prophet preset"""
    data = request.get_json()
    
    conn = get_db_connection()
    existing = conn.execute(
        'SELECT * FROM prophet_presets WHERE preset_name = ?',
        (preset_name,)
    ).fetchone()
    
    if not existing:
        conn.close()
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
    conn.close()
    
    return jsonify({"message": f"Preset '{preset_name}' updated successfully"})

@app.route('/api/prophet/presets/<preset_name>', methods=['DELETE'])
def delete_preset(preset_name):
    """Delete a Prophet preset"""
    conn = get_db_connection()
    result = conn.execute(
        'DELETE FROM prophet_presets WHERE preset_name = ?',
        (preset_name,)
    )
    conn.commit()
    
    if result.rowcount > 0:
        conn.close()
        return jsonify({"message": f"Preset '{preset_name}' deleted successfully"})
    else:
        conn.close()
        return jsonify({"error": "Preset not found"}), 404

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("\nFlask server starting on http://0.0.0.0:5000")
    print("Test credentials: admin@pinkcafe.com / admin123")
    app.run(debug=True, host='0.0.0.0', port=5000)
