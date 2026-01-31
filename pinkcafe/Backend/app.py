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

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("\nFlask server starting on http://localhost:5000")
    print("Test credentials: admin@pinkcafe.com / admin123")
    app.run(debug=True, port=5000)
