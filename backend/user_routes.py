from flask import Blueprint, request, jsonify
import sqlite3

user_routes = Blueprint('user_routes', __name__)

def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Get all students
@user_routes.route('/students', methods=['GET'])
def get_students():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role = 'Student'")
    rows = cursor.fetchall()
    students = [{"id": row["id"], "name": row["name"]} for row in rows]
    conn.close()
    return jsonify(students)

# Add new student
@user_routes.route('/add-student', methods=['POST'])
def add_student():
    data = request.get_json()
    student_id = data.get('id')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role', 'Student')

    if not student_id or not name or not password:
        return jsonify({"error": "Missing id, name or password"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
            (student_id, name, password, role)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Student added successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "User with this ID already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Edit student (name and optionally password)
@user_routes.route('/edit-student/<student_id>', methods=['PUT'])
def edit_student(student_id):
    data = request.get_json()
    name = data.get('name')
    password = data.get('password')  # Optional

    if not name:
        return jsonify({"error": "Name is required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        if password:
            cursor.execute(
                "UPDATE users SET name = ?, password = ? WHERE id = ? AND role = 'Student'",
                (name, password, student_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET name = ? WHERE id = ? AND role = 'Student'",
                (name, student_id)
            )
        if cursor.rowcount == 0:
            return jsonify({"error": "Student not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Student updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete student
@user_routes.route('/delete-student/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ? AND role = 'Student'", (student_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Student not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Student deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_routes.route('/tutors', methods=['GET'])
def get_tutors():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role = 'Tutor'")
    rows = cursor.fetchall()
    tutors = [{"id": row["id"], "name": row["name"]} for row in rows]
    conn.close()
    return jsonify(tutors)
    
@user_routes.route('/add-tutor', methods=['POST'])
def add_tutor():
    data = request.get_json()
    tutor_id = data.get('id')
    name = data.get('name')
    password = data.get('password')
    role = 'Tutor'

    if not tutor_id or not name or not password:
        return jsonify({"error": "Missing id, name or password"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
            (tutor_id, name, password, role)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Tutor added successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "User with this ID already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # Edit tutor (name and optionally password)
@user_routes.route('/edit-tutor/<tutor_id>', methods=['PUT'])
def edit_tutor(tutor_id):
    data = request.get_json()
    name = data.get('name')
    password = data.get('password')  # Optional

    if not name:
        return jsonify({"error": "Name is required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        if password:
            cursor.execute(
                "UPDATE users SET name = ?, password = ? WHERE id = ? AND role = 'Tutor'",
                (name, password, tutor_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET name = ? WHERE id = ? AND role = 'Tutor'",
                (name, tutor_id)
            )
        if cursor.rowcount == 0:
            return jsonify({"error": "Tutor not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Tutor updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete tutor
@user_routes.route('/delete-tutor/<tutor_id>', methods=['DELETE'])
def delete_tutor(tutor_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ? AND role = 'Tutor'", (tutor_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Tutor not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Tutor deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500