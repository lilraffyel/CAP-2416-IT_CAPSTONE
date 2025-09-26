# admin_routes.py
'''
from flask import Blueprint, request, jsonify
import sqlite3

admin_routes = Blueprint('admin_routes', __name__)

# Database connection helper
def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# ─── Fetch all students ─────────────────────────────────────────────────
@admin_routes.route('/students', methods=['GET'])
def get_students():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role='Student'")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(students)

# ─── Fetch all tutors ──────────────────────────────────────────────────
@admin_routes.route('/tutors', methods=['GET'])
def get_tutors():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role='Tutor'")
    tutors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(tutors)

# ─── Assign a tutor to a student ───────────────────────────────────────
@admin_routes.route('/assign-tutor', methods=['POST'])
def assign_tutor():
    data = request.get_json()
    student_id = data.get('studentId')
    tutor_id = data.get('tutorId')

    if not student_id or not tutor_id:
        return jsonify({'error': 'Student ID and Tutor ID are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tutor_assignments (student_id, tutor_id)
        VALUES (?, ?)
    """, (student_id, tutor_id))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Tutor assigned successfully'})

# ─── Fetch tutor assignments ───────────────────────────────────────────
@admin_routes.route('/tutor-assignments', methods=['GET'])
def get_tutor_assignments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ta.id, ta.student_id, s.name AS student_name,
               ta.tutor_id, t.name AS tutor_name, ta.assigned_at
        FROM tutor_assignments ta
        JOIN users s ON ta.student_id = s.id
        JOIN users t ON ta.tutor_id = t.id
        ORDER BY ta.assigned_at DESC
    """)
    assignments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(assignments)
'''

# backend/routes/admin_routes.py
from flask import Blueprint, request, jsonify
from database import get_db_connection  # ✅ use your existing helper

admin_routes = Blueprint('admin_routes', __name__)

# 🔹 1. Get all help requests with student & domain info
@admin_routes.route('/help-requests', methods=['GET'])
def get_help_requests():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT hr.id, hr.student_id, u.name as student_name, 
               hr.domain_id, cd.name as domain_name, hr.status
        FROM help_requests hr
        JOIN users u ON hr.student_id = u.id
        JOIN content_domains cd ON hr.domain_id = cd.id
        ORDER BY hr.requested_at DESC
    """)
    help_requests = cursor.fetchall()
    conn.close()

    result = []
    for hr in help_requests:
        result.append({
            "id": hr["id"],
            "student_id": hr["student_id"],
            "student_name": hr["student_name"],
            "domain_id": hr["domain_id"],
            "domain_name": hr["domain_name"],
            "status": hr["status"]
        })

    return jsonify(result)

# 🔹 2. Get all tutors
@admin_routes.route('/tutors', methods=['GET'])
def get_tutors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role = 'Tutor'")
    tutors = cursor.fetchall()
    conn.close()

    return jsonify([{"id": t["id"], "name": t["name"]} for t in tutors])

'''
# 🔹 3. Assign tutor to help request
@app.route('/api/admin/assign-tutor', methods=['POST'])
def assign_tutor():
    data = request.get_json()
    tutor_id = data.get('tutor_id')
    help_request_id = data.get('help_request_id')
    student_id = data.get('student_id')  # <-- you need to pass this from frontend
    domain_id = data.get('domain_id')    # optional

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tutor_assignments (student_id, tutor_id, help_request_id, domain_id)
        VALUES (?, ?, ?, ?)
    """, (student_id, tutor_id, help_request_id, domain_id))

     # Optional: update help_requests status
    cursor.execute("""
        UPDATE help_requests
        SET status = 'Assigned'
        WHERE id = ?
    """, (help_request_id,))
    conn.commit()
    return jsonify({'message': 'Tutor assigned successfully'})
'''

''' WORKING
@admin_routes.route('/assign-tutor', methods=['POST'])
def assign_tutor():
    data = request.json
    help_request_id = data.get('help_request_id')
    tutor_id = data.get('tutor_id')

    if not help_request_id or not tutor_id:
        return jsonify({'error': 'help_request_id and tutor_id are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔹 Fetch student_id and domain_id from help_requests
    cursor.execute("SELECT student_id, domain_id FROM help_requests WHERE id = ?", (help_request_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Help request not found'}), 404

    student_id = row['student_id']
    domain_id = row['domain_id']

    # 🔹 Insert into tutor_assignments
    cursor.execute("""
        INSERT INTO tutor_assignments (tutor_id, student_id, help_request_id, domain_id)
        VALUES (?, ?, ?, ?)
    """, (tutor_id, student_id, help_request_id, domain_id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Tutor assigned successfully!'})

'''

@admin_routes.route('/assign-tutor', methods=['POST'])
def assign_tutor():
    data = request.json
    help_request_id = data.get('help_request_id')
    tutor_id = data.get('tutor_id')

    if not help_request_id or not tutor_id:
        return jsonify({'error': 'help_request_id and tutor_id are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔹 1. Check if help_request exists and status
    cursor.execute("SELECT student_id, domain_id, status FROM help_requests WHERE id = ?", (help_request_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Help request not found'}), 404

    student_id = row['student_id']
    domain_id = row['domain_id']
    status = row['status']

    if status == "Assigned":
        conn.close()
        return jsonify({'error': 'This help request is already assigned.'}), 400

    # 🔹 2. Insert into tutor_assignments
    cursor.execute("""
        INSERT INTO tutor_assignments (tutor_id, student_id, help_request_id, domain_id)
        VALUES (?, ?, ?, ?)
    """, (tutor_id, student_id, help_request_id, domain_id))

    # 🔹 3. Update help_requests table (status + optional tutor_id)
    cursor.execute("""
        UPDATE help_requests
        SET status = 'Assigned'
        WHERE id = ?
    """, (help_request_id,))

    # (optional: if you want to store tutor_id directly in help_requests)
    # cursor.execute("""
    #     UPDATE help_requests
    #     SET status = 'Assigned', tutor_id = ?
    #     WHERE id = ?
    # """, (tutor_id, help_request_id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Tutor assigned successfully!'})


@admin_routes.route('/tutor-assignments', methods=['GET'])
def get_tutor_assignments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ta.id,
               ta.help_request_id,
               hr.student_id,
               u.name as student_name,
               hr.domain_id,
               cd.name as domain_name,
               ta.tutor_id,
               t.name as tutor_name,
               ta.assigned_at
        FROM tutor_assignments ta
        JOIN help_requests hr ON ta.help_request_id = hr.id
        JOIN users u ON hr.student_id = u.id
        JOIN content_domains cd ON hr.domain_id = cd.id
        JOIN users t ON ta.tutor_id = t.id
        ORDER BY ta.assigned_at DESC
    """)
    assignments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(assignments)
