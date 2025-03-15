from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import database as db
import os
import logging

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize the database
try:
    db.init_db()
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Error initializing database: {str(e)}")

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Authentication endpoints
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        logger.debug(f"Registration attempt for username: {username}, email: {email}")

        if not all([username, password, email]):
            logger.error("Missing required fields")
            return jsonify({'message': 'Missing required fields'}), 400

        if len(password) < 8:
            logger.error("Password too short")
            return jsonify({'message': 'Password must be at least 8 characters long'}), 400

        if not any(char.isdigit() for char in password):
            logger.error("Password missing number")
            return jsonify({'message': 'Password must include at least one number'}), 400

        if db.create_user(username, password, email):
            logger.info(f"User {username} created successfully")
            return jsonify({'message': 'User created successfully'}), 201
        else:
            logger.error(f"Username or email already exists: {username}, {email}")
            return jsonify({'message': 'Username or email already exists'}), 409

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': f'Registration error: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        password = data.get('password')

        logger.debug(f"Login attempt for username: {username}")

        if not all([username, password]):
            logger.error("Missing required fields")
            return jsonify({'message': 'Missing required fields'}), 400

        user_id = db.verify_user(username, password)
        if user_id:
            logger.info(f"User {username} logged in successfully")
            return jsonify({'userId': user_id, 'message': 'Login successful'}), 200
        else:
            logger.error(f"Invalid credentials for username: {username}")
            return jsonify({'message': 'Invalid credentials'}), 401

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': f'Login error: {str(e)}'}), 500

# Emissions data endpoints
@app.route('/api/emissions', methods=['POST'])
def save_emissions():
    try:
        data = request.get_json()
        if not data:
            logger.error("No JSON data received")
            return jsonify({'message': 'No data provided'}), 400

        user_id = data.get('userId')
        transport_type = data.get('transportType')
        transport_distance = data.get('transportDistance')
        energy_source = data.get('energySource')
        energy_usage = data.get('energyUsage')
        diet_type = data.get('dietType')
        total_emissions = data.get('totalEmissions')

        if not all([user_id, transport_type, transport_distance, energy_source, 
                    energy_usage, diet_type, total_emissions]):
            logger.error("Missing required fields")
            return jsonify({'message': 'Missing required fields'}), 400

        db.save_emissions_data(user_id, transport_type, transport_distance,
                             energy_source, energy_usage, diet_type, total_emissions)
        logger.info(f"Emissions data saved for user {user_id}")
        return jsonify({'message': 'Emissions data saved successfully'}), 201

    except Exception as e:
        logger.error(f"Error saving emissions data: {str(e)}")
        return jsonify({'message': str(e)}), 500

@app.route('/api/emissions/<int:user_id>', methods=['GET'])
def get_emissions(user_id):
    try:
        emissions = db.get_user_emissions_history(user_id)
        logger.info(f"Retrieved emissions history for user {user_id}")
        return jsonify({'emissions': emissions}), 200
    except Exception as e:
        logger.error(f"Error retrieving emissions data: {str(e)}")
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 