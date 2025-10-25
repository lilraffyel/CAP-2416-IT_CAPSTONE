'''
from flask import Blueprint, request, jsonify
from flask import session
from database import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data.get('id')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    if user and user['password'] == password:
        session['student_id'] = user['id'] 
        return jsonify({'status': 'success', 'role': user['role']})
    else:
        return jsonify({'status': 'fail'}), 401 
'''  

from flask import Blueprint, request, jsonify, session
from database import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data.get('id')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if user and user['password'] == password:
        # always store base info
        session['user_id'] = user['id']
        session['role'] = user['role']

        # store extra info based on role
        if user['role'] == 'Student':
            session['student_id'] = user['id']
        elif user['role'] == 'Tutor':
            session['tutor_id'] = user['id']

        return jsonify({'status': 'success', 'role': user['role']})
    else:
        return jsonify({'status': 'fail'}), 401
    

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@auth_bp.route('/me', methods=['GET'])
def get_me():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({
        'userId': session['user_id'],
        'role': session['role'],
        'studentId': session.get('student_id'),
        'tutorId': session.get('tutor_id')
    })
