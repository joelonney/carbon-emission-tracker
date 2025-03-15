import sqlite3
import hashlib
import os
from datetime import datetime

def init_db():
    conn = sqlite3.connect('carbon_footprint.db')
    c = conn.cursor()

    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create emissions_data table
    c.execute('''
        CREATE TABLE IF NOT EXISTS emissions_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transport_type TEXT,
            transport_distance REAL,
            energy_source TEXT,
            energy_usage REAL,
            diet_type TEXT,
            total_emissions REAL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Create achievements table
    c.execute('''
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_name TEXT NOT NULL,
            achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    conn.commit()
    conn.close()

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username, password, email):
    """Create a new user"""
    conn = sqlite3.connect('carbon_footprint.db')
    c = conn.cursor()
    try:
        password_hash = hash_password(password)
        c.execute('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                 (username, password_hash, email))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def verify_user(username, password):
    """Verify user credentials"""
    conn = sqlite3.connect('carbon_footprint.db')
    c = conn.cursor()
    password_hash = hash_password(password)
    c.execute('SELECT id FROM users WHERE username = ? AND password_hash = ?',
             (username, password_hash))
    result = c.fetchone()
    conn.close()
    return result[0] if result else None

def save_emissions_data(user_id, transport_type, transport_distance, 
                       energy_source, energy_usage, diet_type, total_emissions):
    """Save user's emissions data"""
    conn = sqlite3.connect('carbon_footprint.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO emissions_data 
        (user_id, transport_type, transport_distance, energy_source, 
         energy_usage, diet_type, total_emissions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, transport_type, transport_distance, energy_source, 
          energy_usage, diet_type, total_emissions))
    conn.commit()
    conn.close()

def get_user_emissions_history(user_id):
    """Get user's emissions history"""
    conn = sqlite3.connect('carbon_footprint.db')
    c = conn.cursor()
    c.execute('''
        SELECT date, total_emissions, transport_type, energy_source, diet_type 
        FROM emissions_data 
        WHERE user_id = ? 
        ORDER BY date DESC
    ''', (user_id,))
    result = c.fetchall()
    conn.close()
    return result

if __name__ == '__main__':
    init_db() 