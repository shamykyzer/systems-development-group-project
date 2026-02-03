import sqlite3
import pandas as pd
import os

# Database configuration
DATABASE = 'pinkcafe.db'
CSV_PATH = os.path.join('CSV_Files', 'Pink CoffeeSales March - Oct 2025.csv')

def import_csv_to_database():
    """Import CSV data into SQLite database"""
    
    # Read the CSV file
    print(f"Reading CSV file: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    
    # Parse dates (format is DD/MM/YYYY)
    df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y')
    
    print(f"Loaded {len(df)} rows from CSV")
    print(f"Columns: {df.columns.tolist()}")
    print(f"\nFirst few rows:")
    print(df.head())
    
    # Connect to SQLite database
    print(f"\nConnecting to database: {DATABASE}")
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create table for coffee sales
    print("Creating coffee_sales table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coffee_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            cappuccino INTEGER NOT NULL,
            americano INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Clear existing data (optional - remove if you want to keep old data)
    cursor.execute('DELETE FROM coffee_sales')
    print("Cleared existing data from table")
    
    # Insert CSV data into database
    print("\nInserting data into database...")
    for index, row in df.iterrows():
        cursor.execute('''
            INSERT INTO coffee_sales (date, cappuccino, americano)
            VALUES (?, ?, ?)
        ''', (row['Date'].strftime('%Y-%m-%d'), row['Cappuccino'], row['Americano']))
    
    # Commit changes
    conn.commit()
    
    # Verify the import
    cursor.execute('SELECT COUNT(*) FROM coffee_sales')
    count = cursor.fetchone()[0]
    print(f"\n✓ Successfully imported {count} records into database")
    
    # Show some sample data
    print("\nSample data from database:")
    cursor.execute('SELECT * FROM coffee_sales ORDER BY date DESC LIMIT 5')
    rows = cursor.fetchall()
    for row in rows:
        print(f"  ID: {row[0]}, Date: {row[1]}, Cappuccino: {row[2]}, Americano: {row[3]}")
    
    # Show statistics
    print("\nSales Statistics:")
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
    print(f"  Total Days: {stats[0]}")
    print(f"  Total Cappuccino Sold: {stats[1]}")
    print(f"  Total Americano Sold: {stats[2]}")
    print(f"  Average Cappuccino/Day: {stats[3]:.2f}")
    print(f"  Average Americano/Day: {stats[4]:.2f}")
    print(f"  Date Range: {stats[5]} to {stats[6]}")
    
    conn.close()
    print(f"\n✓ Database saved as: {DATABASE}")

if __name__ == '__main__':
    import_csv_to_database()
