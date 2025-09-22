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
