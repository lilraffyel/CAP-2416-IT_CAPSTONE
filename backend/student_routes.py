from flask import Blueprint, request, jsonify, session
from database import get_db_connection
from query_helpers import run_manual_query, run_auto_query
from prerequisite.prerequisite_api import get_model # <-- Add this import
import sqlite3 # <-- Add this import

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
    
# --- NEW: Routes for Student Progress Table ---

@student_bp.route('/competencies', methods=['GET'])
def get_student_competencies():
    domain_id = request.args.get('domain')
    conn = get_db_connection()
    cursor = conn.cursor()
    if domain_id:
        cursor.execute("""
            SELECT c.id, c.title AS label, a.competency_node, c.content_domain_id
            FROM competencies c
            LEFT JOIN assessments a ON a.title = c.title
            WHERE c.content_domain_id = ?
        """, (domain_id,))
    else:
        cursor.execute("""
            SELECT c.id, c.title AS label, a.competency_node, c.content_domain_id
            FROM competencies c
            LEFT JOIN assessments a ON a.title = c.title
        """)
    competencies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(competencies)

@student_bp.route('/student-progress/<student_id>', methods=['GET'])
def get_student_progress_data(student_id):
    domain_id = request.args.get('domain_id')
    if not domain_id:
        return jsonify({'error': 'Missing domain_id'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT competency_node, estimated_mastery, raw_score, percentage, actual_mastery, is_locked
            FROM student_progress
            WHERE student_id = ? AND domain_id = ?
        """, (student_id, domain_id))
        progress_data = {row['competency_node']: dict(row) for row in cursor.fetchall()}
    except sqlite3.OperationalError:
        progress_data = {}
    
    conn.close()
    return jsonify(progress_data)

@student_bp.route('/assessments', methods=['GET'])
def get_student_assessments_structure():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.title, a.bif_file, cd.name AS domain, a.content_domain_id, a.competency_node
        FROM assessments a
        LEFT JOIN content_domains cd ON a.content_domain_id = cd.id
    """)
    rows = cursor.fetchall()
    result = {}
    for row in rows:
        domain = row['domain'] or "Uncategorized"
        if domain not in result:
            result[domain] = []
        result[domain].append({
            "title": row['title'],
            "bif_file": row['bif_file'],
            "content_domain_id": row['content_domain_id'],
            "competency_node": row['competency_node']
        })
    conn.close()
    return jsonify(result)

@student_bp.route('/network-structure', methods=['GET'])
def get_student_network_structure():
    bif_file = request.args.get('bif_file')
    model_data = get_model(bif_file)
    if not model_data:
        return jsonify({'error': 'Network not found'}), 404
    model = model_data['model']
    structure = []
    for node in model.nodes():
        parents = list(model.get_parents(node))
        structure.append({'node': node, 'parents': parents})
    return jsonify(structure)

# --- END NEW ---

@student_bp.route('/results/<student_id>', methods=['GET'])
def get_student_results(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT sr.id AS result_id, sr.submitted_at, a.title, sr.score, sr.total
            FROM student_results sr
            JOIN assessments a ON sr.assessment_id = a.id
            WHERE sr.student_id = ?
            ORDER BY sr.submitted_at DESC
        """, (student_id,))
        rows = cursor.fetchall()

        results = [{
            "result_id": row["result_id"],
            "date": row["submitted_at"],
            "examName": row["title"],
            "score": row["score"],
            "total": row["total"],
        } for row in rows]

        conn.close()
        return jsonify(results)
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": "Database error"}), 500


@student_bp.route('/manual-query', methods=['POST'])
def student_manual_query():
    data = request.get_json() or {}
    bif_file = data.get('bif_file')
    competency = data.get('competency')
    score = data.get('score')
    total = data.get('total', 10)

    if score is None:
        return jsonify({'error': 'Missing score for manual query'}), 400

    result, error = run_manual_query(bif_file, competency, score, total)
    if error:
        lower_error = error.lower()
        status = 404 if ('not found' in lower_error or 'not loaded' in lower_error) else 400
        return jsonify({'error': error}), status

    return jsonify(result)


@student_bp.route('/auto-query-result/<int:result_id>', methods=['GET'])
def student_auto_query(result_id):
    result, error = run_auto_query(result_id)
    if error:
        lower_error = error.lower()
        status = 404 if ('not found' in lower_error or 'not loaded' in lower_error) else 400
        return jsonify({'error': error}), status

    return jsonify(result)

