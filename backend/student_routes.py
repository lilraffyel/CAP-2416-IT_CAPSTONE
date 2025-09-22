from flask import Blueprint, request, jsonify, session
from database import get_db_connection

student_bp = Blueprint('student', __name__)

# Get current logged-in student ID
@student_bp.route('/me')
def get_current_student():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({'studentId': student_id})

# Get all content domains
@student_bp.route('/domains')
def get_content_domains():
    try:
        conn = get_db_connection()
        domains = conn.execute('SELECT id, name FROM content_domains').fetchall()
        conn.close()
        domain_list = [{'id': d['id'], 'name': d['name']} for d in domains]
        return jsonify(domain_list)
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": "Failed to fetch domains"}), 500

# Submit a help request
@student_bp.route('/help-request', methods=['POST'])
def submit_help_request():
    data = request.get_json()
    student_id = data.get('studentId')
    domain_id = data.get('domainId')

    if not student_id or not domain_id:
        return jsonify({"error": "Missing studentId or domainId"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO help_requests (student_id, domain_id) VALUES (?, ?)",
            (student_id, domain_id,)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Help request submitted!"})
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": "Database error"}), 500
    

@student_bp.route('/results/<student_id>', methods=['GET'])
def get_student_results(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT sr.submitted_at, a.title, sr.score
            FROM student_results sr
            JOIN assessments a ON sr.assessment_id = a.id
            WHERE sr.student_id = ?
            ORDER BY sr.submitted_at DESC
        """, (student_id,))
        rows = cursor.fetchall()

        results = [{
            "date": row["submitted_at"],
            "examName": row["title"],
            "score": row["score"]
        } for row in rows]

        conn.close()
        return jsonify(results)
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": "Database error"}), 500

