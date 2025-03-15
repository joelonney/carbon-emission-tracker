from flask import Flask, render_template, request, redirect, url_for, flash, session
from database import Database
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
db = Database()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = db.verify_user(username, password)
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Successfully logged in!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        
        if db.add_user(username, password, email):
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Username or email already exists', 'error')
    
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    user_emissions = db.get_user_emissions(session['user_id'])
    user_achievements = db.get_user_achievements(session['user_id'])
    return render_template('index.html', 
                         emissions=user_emissions, 
                         achievements=user_achievements,
                         username=session['username'])

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/save_emission', methods=['POST'])
@login_required
def save_emission():
    data = request.get_json()
    db.save_emission(
        session['user_id'],
        data['transport_type'],
        data['transport_distance'],
        data['diet_type'],
        data['energy_source'],
        data['total_emissions']
    )
    return {'status': 'success'}

if __name__ == '__main__':
    app.run(debug=True) 