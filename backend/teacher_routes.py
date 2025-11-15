from flask import Blueprint, request, jsonify, send_from_directory
from pgmpy.readwrite.BIF import BIFReader
from pgmpy.inference import VariableElimination
# --- FIX: Import the get_model function instead of the cache dictionary ---
from prerequisite.prerequisite_api import get_model
from query_helpers import run_manual_query, run_auto_query
import sqlite3
import os


#Allowed File Types
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'}

def is_allowed_file(filename: str) -> bool:
    import os
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


teacher_routes = Blueprint('teacher_routes', __name__)

def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


def ensure_tutor_notes_table(cursor):
    """Create or upgrade the tutor_notes table to support note history."""

    base_table_sql = """
        CREATE TABLE IF NOT EXISTS tutor_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutor_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            comment TEXT,
            materials TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated_by TEXT,
            FOREIGN KEY (tutor_id) REFERENCES users(id),
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """

    cursor.execute(base_table_sql)
    cursor.connection.commit()

    cursor.execute("PRAGMA table_info(tutor_notes)")
    columns = {row[1] for row in cursor.fetchall()}

    if "last_updated_by" not in columns:
        cursor.execute("ALTER TABLE tutor_notes ADD COLUMN last_updated_by TEXT")
        cursor.connection.commit()

    # Older databases created the table with a UNIQUE constraint on (tutor_id, student_id)
    # which prevents storing multiple note entries per tutor. Detect that schema and
    # rebuild the table without the constraint so every save is preserved.
    cursor.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='tutor_notes'"
    )
    table_row = cursor.fetchone()
    table_sql = None
    if table_row:
        # sqlite3.Row supports key lookup, otherwise fall back to index access.
        try:
            table_sql = table_row["sql"]
        except (TypeError, KeyError):
            table_sql = table_row[0] if table_row else None

    normalized_sql = (table_sql or "").upper()

    needs_rebuild = "UNIQUE" in normalized_sql

    if not needs_rebuild:
        cursor.execute("PRAGMA index_list('tutor_notes')")
        for index_info in cursor.fetchall():
            # PRAGMA index_list returns (seq, name, unique, origin, partial)
            try:
                is_unique = bool(index_info[2])
            except (IndexError, TypeError):
                is_unique = False
            if is_unique:
                needs_rebuild = True
                break

    if needs_rebuild:
        cursor.execute("ALTER TABLE tutor_notes RENAME TO tutor_notes_legacy")
        cursor.connection.commit()

        cursor.execute(base_table_sql)
        cursor.connection.commit()

        cursor.execute("SELECT * FROM tutor_notes_legacy")
        legacy_rows = cursor.fetchall()

        for row in legacy_rows:
            if hasattr(row, "keys"):
                row_dict = {key: row[key] for key in row.keys()}
            else:
                # Fall back to the tuple representation using cursor description.
                desc = cursor.description or []
                row_dict = {
                    desc[i][0]: row[i]
                    for i in range(min(len(desc), len(row)))
                }

            tutor_id = row_dict.get("tutor_id")
            student_id = row_dict.get("student_id")
            if not tutor_id or not student_id:
                continue

            comment = row_dict.get("comment", "") or ""
            materials = row_dict.get("materials", "") or ""
            updated_at = row_dict.get("updated_at")
            last_updated_by = row_dict.get("last_updated_by") or tutor_id

            cursor.execute(
                """
                INSERT INTO tutor_notes (
                    tutor_id,
                    student_id,
                    comment,
                    materials,
                    updated_at,
                    last_updated_by
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    tutor_id,
                    student_id,
                    comment,
                    materials,
                    updated_at,
                    last_updated_by,
                ),
            )

        cursor.execute("DROP TABLE tutor_notes_legacy")
        cursor.connection.commit()


def build_tutor_note_payload(cursor, student_id):
    """Return the most recent note and the full history for a student."""
    ensure_tutor_notes_table(cursor)

    cursor.execute(
        """
        SELECT
            tn.id,
            tn.comment,
            tn.materials,
            tn.updated_at,
            tn.tutor_id,
            COALESCE(tn.last_updated_by, tn.tutor_id) AS author_id,
            u.name AS author_name
        FROM tutor_notes tn
        LEFT JOIN users u ON u.id = COALESCE(tn.last_updated_by, tn.tutor_id)
        WHERE tn.student_id = ?
        ORDER BY tn.updated_at DESC, tn.id DESC
        """,
        (student_id,),
    )

    rows = cursor.fetchall()

    history = []
    for row in rows:
        history.append(
            {
                "id": row["id"],
                "comment": row["comment"] or "",
                "materials": row["materials"] or "",
                "updated_at": row["updated_at"],
                "last_updated_by": row["author_id"],
                "last_updated_by_name": row["author_name"],
                "author_id": row["author_id"],
                "author_name": row["author_name"],
                "tutor_id": row["tutor_id"],
            }
        )

    latest = history[0].copy() if history else None
    entries = [entry.copy() for entry in history]

    return {
        "latest": latest.copy() if latest else None,
        "history": [entry.copy() for entry in entries],
        "entries": [entry.copy() for entry in entries],
        "count": len(entries),
    }


# ─── File Upload Storage Helper ─────────────────────────────────────────────


UPLOAD_ROOT = os.path.join(os.getcwd(), "uploads", "tutor_materials")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

def ensure_tutor_materials_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutor_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            mime_type TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tutor_id) REFERENCES users(id),
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """)
    cursor.connection.commit()



# ─── Student and Domain Info ─────────────────────────────────────────────

@teacher_routes.route('/students', methods=['GET'])
def get_students():
    tutor_id = request.args.get('tutor_id')
    conn = get_db()
    cursor = conn.cursor()
    if tutor_id:
        # Only students assigned to this tutor, no duplicates
        cursor.execute("""
            SELECT DISTINCT u.id, u.name
            FROM users u
            INNER JOIN tutor_assignments ta ON u.id = ta.student_id
            WHERE ta.tutor_id = ? AND u.role = 'Student'
        """, (tutor_id,))
    else:
        cursor.execute("SELECT id, name FROM users WHERE role = 'Student'")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(students)

@teacher_routes.route('/tutor/<tutor_id>/students', methods=['GET'])
def get_tutor_students_overview(tutor_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            u.id AS student_id,
            u.name AS student_name,
            MIN(ta.assigned_at) AS first_assigned_at,
            COALESCE(MAX(sr.submitted_at), '') AS last_submitted_at,
            COUNT(DISTINCT sr.id) AS completed_assessments,
            AVG(
                CASE WHEN sr.total > 0 THEN (CAST(sr.score AS REAL) / sr.total) * 100
                     ELSE NULL
                END
            ) AS average_percent
        FROM tutor_assignments ta
        JOIN users u ON u.id = ta.student_id
        LEFT JOIN student_results sr ON sr.student_id = u.id
        WHERE ta.tutor_id = ?
        GROUP BY u.id, u.name
        ORDER BY u.name COLLATE NOCASE
        """,
        (tutor_id,),
    )

    rows = cursor.fetchall()
    conn.close()

    students = []
    for row in rows:
        avg_percent = row["average_percent"]
        students.append(
            {
                "studentId": row["student_id"],
                "studentName": row["student_name"],
                "firstAssignedAt": row["first_assigned_at"],
                "lastSubmittedAt": row["last_submitted_at"],
                "completedAssessments": row["completed_assessments"],
                "averagePercent": round(avg_percent, 2) if avg_percent is not None else None,
            }
        )

    return jsonify(students)
'''
@teacher_routes.route('/students', methods=['GET'])
def get_students():
    tutor_id = request.args.get('tutor_id')  # get tutor_id from query param
    print("Received tutor_id:", tutor_id)

    if not tutor_id:
        return jsonify({'error': 'Missing tutor_id'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Join tutor_assignments with users to get only students assigned to that tutor_id
    cursor.execute("""
        SELECT u.id, u.name
        FROM users u
        INNER JOIN tutor_assignments ta ON u.id = ta.student_id
        WHERE ta.tutor_id = ? AND u.role = 'Student'
    """, (tutor_id,))

    students = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify(students)
'''



@teacher_routes.route('/help-requests', methods=['GET'])
def get_help_requests():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT hr.student_id, d.name AS domain
        FROM help_requests hr
        JOIN content_domains d ON hr.domain_id = d.id
        WHERE hr.status = 'Pending'
    """)
    rows = cursor.fetchall()
    help_requests = [{'studentId': row['student_id'], 'domain': row['domain']} for row in rows]
    conn.close()
    return jsonify(help_requests)

@teacher_routes.route('/domains', methods=['GET'])
def get_domains():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM content_domains")
    domains = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(domains)

@teacher_routes.route('/competencies', methods=['GET'])
def get_competencies():
    domain_id = request.args.get('domain')

    conn = get_db()
    cursor = conn.cursor()

    if domain_id:
        cursor.execute("""
            SELECT c.id, c.title AS label
            FROM competencies c
            WHERE c.content_domain_id = ?
        """, (domain_id,))
    else:
        cursor.execute("""
            SELECT c.id, c.title AS label
            FROM competencies c
        """)

    competencies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(competencies)

# ─── Assignment API ─────────────────────────────────────────────────────
@teacher_routes.route('/assignments', methods=['GET'])
def get_assignments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.student_id, a.competency_id
        FROM assignments a
    """)
    rows = cursor.fetchall()
    assignments = {}
    for row in rows:
        assignments.setdefault(row['student_id'], []).append(row['competency_id'])
    conn.close()
    return jsonify(assignments)


@teacher_routes.route('/assign', methods=['POST'])
def assign_competency():
    data = request.get_json()
    student_id = data.get('studentId')
    competency_id = data.get('competencyId')
    tutor_id = data.get('tutorId')  # <-- now sent from frontend

    if not tutor_id:
        return jsonify({'error': 'Tutor ID is required'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO assignments (student_id, competency_id, tutor_id) VALUES (?, ?, ?)',
        (student_id, competency_id, tutor_id)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Assignment saved'})


# ─── Assessment Viewing ─────────────────────────────────────────────────

@teacher_routes.route('/student-assessments/<student_id>', methods=['GET'])
def get_student_assessments(student_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.title FROM assignments a
        JOIN competencies c ON a.competency_id = c.id
        WHERE a.student_id = ?
    """, (student_id,))
    titles = [row['title'] for row in cursor.fetchall()]
    conn.close()
    return jsonify(titles)

@teacher_routes.route('/student-assessment/<title>', methods=['GET'])
def get_assessment_by_title(title):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
    row = cursor.fetchone()
    if not row:
        return jsonify({'error': 'Assessment not found'}), 404

    assessment_id = row['id']

    cursor.execute("""
        SELECT id, text, correct_answer, score
        FROM questions
        WHERE assessment_id = ?
        ORDER BY RANDOM()   
        LIMIT 10       
    """, (assessment_id,))
    questions = [dict(row) for row in cursor.fetchall()]

    for q in questions:
        cursor.execute("SELECT choice_text FROM choices WHERE question_id = ?", (q['id'],))
        q['choices'] = [c['choice_text'] for c in cursor.fetchall()]
        del q['correct_answer']  # remove answer before sending

    conn.close()
    return jsonify({'title': title, 'questions': questions})

# ─── Tutor Log APIs ────────────────────────────────────────────────────────


@teacher_routes.route('/tutor/<tutor_id>/students/<student_id>/results', methods=['GET'])
def get_tutor_student_results(tutor_id, student_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            sr.id AS result_id,
            a.title AS assessment_name,
            sr.score,
            sr.total,
            sr.attempt_number,
            sr.submitted_at
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE sr.student_id = ?
        ORDER BY sr.submitted_at DESC, sr.attempt_number DESC
        """,
        (student_id,),
    )

    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(results)


@teacher_routes.route('/tutor/<tutor_id>/students/<student_id>/note', methods=['GET'])
def get_tutor_student_note(tutor_id, student_id):
    conn = get_db()
    cursor = conn.cursor()
    payload = build_tutor_note_payload(cursor, student_id)

    conn.close()

    return jsonify(payload)


@teacher_routes.route('/tutor/<tutor_id>/students/<student_id>/note', methods=['POST'])
def save_tutor_student_note(tutor_id, student_id):
    data = request.get_json() or {}
    comment = (data.get('comment', '') or '').strip()
    materials = (data.get('materials', '') or '').strip()

    conn = get_db()
    cursor = conn.cursor()
    ensure_tutor_notes_table(cursor)

    if not comment and not materials:
        conn.close()
        return jsonify({'error': 'Note entry cannot be empty.'}), 400

    cursor.execute(
        """
        INSERT INTO tutor_notes (tutor_id, student_id, comment, materials, last_updated_by)
        VALUES (?, ?, ?, ?, ?)
        """,
        (tutor_id, student_id, comment, materials, tutor_id)
    )

    conn.commit()

    payload = build_tutor_note_payload(cursor, student_id)

    conn.close()

    return jsonify(payload)


@teacher_routes.route('/tutor/<tutor_id>/students/<student_id>/materials', methods=['GET'])
def list_tutor_student_materials(tutor_id, student_id):
    conn = get_db()
    cur = conn.cursor()
    ensure_tutor_materials_table(cur)
    cur.execute("""
        SELECT tm.id,
               tm.tutor_id,
               tm.original_filename,
               tm.stored_path,
               tm.mime_type,
               tm.uploaded_at,
               u.name AS uploader_name
        FROM tutor_materials tm
        LEFT JOIN users u ON u.id = tm.tutor_id
        WHERE tm.student_id = ?
        ORDER BY tm.uploaded_at DESC, tm.id DESC
    """, (student_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)  # return [] if none (200), not 404


@teacher_routes.route('/tutor/<tutor_id>/students/<student_id>/materials', methods=['POST'])
def upload_tutor_student_material(tutor_id, student_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if not file or file.filename.strip() == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # validate file type or extension
    if not is_allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file type. Allowed: pdf, docx, pptx, txt, png, jpg, jpeg'}), 400

    # File Size Validation
    file.seek(0, os.SEEK_END)
    size_bytes = file.tell()
    file.seek(0)
    MAX_ONE_FILE = 20 * 1024 * 1024   # 20 MB limit
    if size_bytes > MAX_ONE_FILE:
        return jsonify({'error': 'File exceeds 20 MB limit'}), 400


    # save file per-tutor/student directory
    subdir = os.path.join(UPLOAD_ROOT, str(tutor_id), str(student_id))
    os.makedirs(subdir, exist_ok=True)

    # avoid collisions
    fname = file.filename
    base, ext = os.path.splitext(fname)
    stored_name = fname
    i = 0
    while os.path.exists(os.path.join(subdir, stored_name)):
        i += 1
        stored_name = f"{base} ({i}){ext}"

    full_path = os.path.join(subdir, stored_name)
    file.save(full_path)

    conn = get_db()
    cur = conn.cursor()
    ensure_tutor_materials_table(cur)
    cur.execute("""
        INSERT INTO tutor_materials (tutor_id, student_id, original_filename, stored_path, mime_type)
        VALUES (?, ?, ?, ?, ?)
    """, (tutor_id, student_id, fname, full_path, file.mimetype))
    conn.commit()
    mat_id = cur.lastrowid
    conn.close()
    return jsonify({'message': 'Uploaded', 'id': mat_id})


@teacher_routes.route('/tutor/materials/<int:material_id>/download', methods=['GET'])
def download_tutor_material(material_id):
    conn = get_db()
    cur = conn.cursor()
    ensure_tutor_materials_table(cur)
    cur.execute("""
        SELECT original_filename, stored_path
        FROM tutor_materials WHERE id=?
    """, (material_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Not found'}), 404

    original_filename = row['original_filename']
    stored_path = row['stored_path']
    if not os.path.exists(stored_path):
        return jsonify({'error': 'File missing on server'}), 410

    folder = os.path.dirname(stored_path)
    fname = os.path.basename(stored_path)
    return send_from_directory(folder, fname, as_attachment=True, download_name=original_filename)




# ─── Submitting Assessment ───────────────────────────────────────────────

@teacher_routes.route('/submit-assessment', methods=['POST'])
def submit_assessment():
    data = request.get_json()
    student_id = data.get('studentId')
    assessment_title = data.get('assessmentTitle')
    answers = data.get('answers', {})

    if not student_id or not assessment_title:
        return jsonify({'error': 'Missing student ID or assessment title'}), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        # Get the assessment ID
        cursor.execute("SELECT id FROM assessments WHERE title = ?", (assessment_title,))
        assessment_row = cursor.fetchone()
        if not assessment_row:
            return jsonify({'error': 'Assessment not found'}), 404
        assessment_id = assessment_row['id']

        # Get all questions for this assessment to get the correct total and check answers
        cursor.execute("SELECT id, correct_answer FROM questions WHERE assessment_id = ?", (assessment_id,))
        all_questions = cursor.fetchall()
        
        total_questions = len(all_questions)
        
        score = 0
        for question in all_questions:
            question_id_str = str(question['id'])
            if question_id_str in answers:
                if answers[question_id_str] == question['correct_answer']:
                    score += 1

        # --- FIX: Calculate the attempt number before inserting ---
        # 1. Find the last attempt number for this student and assessment.
        cursor.execute(
            "SELECT MAX(attempt_number) as max_attempt FROM student_results WHERE student_id = ? AND assessment_id = ?",
            (student_id, assessment_id)
        )
        last_attempt = cursor.fetchone()
        
        # 2. If a previous attempt exists, increment it. Otherwise, start at 1.
        new_attempt_number = 1
        if last_attempt and last_attempt['max_attempt'] is not None:
            new_attempt_number = last_attempt['max_attempt'] + 1

        # 3. Insert the result into the database including the new attempt number.
        cursor.execute(
            "INSERT INTO student_results (student_id, assessment_id, score, total, attempt_number) VALUES (?, ?, ?, ?, ?)",
            (student_id, assessment_id, score, total_questions, new_attempt_number)
        )
        conn.commit()

        return jsonify({'score': score, 'total': total_questions})

    except Exception as e:
        print(f"[ERROR] during assessment submission: {e}")
        return jsonify({'error': 'An internal error occurred during submission.'}), 500
    finally:
        conn.close()


@teacher_routes.route('/latest-results', methods=['GET'])
def get_latest_results():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sr.id as result_id,
               sr.student_id,
               sr.assessment_id,
               a.title AS assessment_name,
               sr.score,
               sr.total,
               sr.attempt_number AS attempt,
               c.title AS competency,
               cd.name AS domain,
               COALESCE(tc.comment, '') AS comment
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        LEFT JOIN competencies c ON c.title = a.title
        LEFT JOIN content_domains cd ON c.content_domain_id = cd.id
        LEFT JOIN teacher_comments tc ON tc.result_id = sr.id
        WHERE sr.attempt_number = (
            SELECT MAX(attempt_number) FROM student_results
            WHERE student_id = sr.student_id AND assessment_id = sr.assessment_id
        )
        ORDER BY sr.student_id, sr.attempt_number DESC
    """)

    results = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in results])


@teacher_routes.route('/comment', methods=['POST'])
def save_comment():
    data = request.get_json()
    result_id = data.get('resultId')
    comment = data.get('comment')

    if not result_id:
        return jsonify({'error': 'Missing resultId'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO teacher_comments (result_id, comment)
        VALUES (?, ?)
        ON CONFLICT(result_id) DO UPDATE SET comment=excluded.comment
    """, (result_id, comment))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Comment saved successfully'})

@teacher_routes.route('/result/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Delete any comments linked to this result first (if any)
        cursor.execute("DELETE FROM teacher_comments WHERE result_id = ?", (result_id,))
        
        # Then delete the student result
        cursor.execute("DELETE FROM student_results WHERE id = ?", (result_id,))
        
        conn.commit()
        return jsonify({'message': 'Result deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# @teacher_routes.route('/assessment-levels', methods=['GET'])
# def get_levels_and_assessments():
#     conn = get_db()
#     cursor = conn.cursor()

#     cursor.execute("""
#         SELECT cd.name AS domain, c.title AS competency
#         FROM content_domains cd
#         JOIN competencies c ON c.content_domain_id = cd.id
#     """)
#     rows = cursor.fetchall()

#     result = {}
#     for row in rows:
#         domain = row['domain']
#         comp = row['competency']
#         result.setdefault(domain, []).append(comp)

#     conn.close()
#     return jsonify(result)

# @teacher_routes.route('/assessment/<title>', methods=['GET'])
# def get_questions(title):
#     conn = get_db()
#     cursor = conn.cursor()

#     cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
#     row = cursor.fetchone()
#     if not row:
#         return jsonify([])

#     assessment_id = row['id']
#     cursor.execute("""
#         SELECT q.id, q.text, q.correct_answer, q.score
#         FROM questions q
#         WHERE q.assessment_id = ?
#     """, (assessment_id,))
#     questions = [dict(row) for row in cursor.fetchall()]

#     for q in questions:
#         cursor.execute("SELECT choice_text FROM choices WHERE question_id = ?", (q['id'],))
#         q['options'] = [c['choice_text'] for c in cursor.fetchall()]
#         q['pinned'] = False;
#         q['comments'] = []
#     conn.close()
#     return jsonify(questions)


# @teacher_routes.route('/assessment/<title>', methods=['POST'])
# def save_questions(title):
#     data = request.get_json()
#     questions = data.get('questions', [])

#     conn = get_db()
#     cursor = conn.cursor()

#     # Get assessment ID
#     cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
#     row = cursor.fetchone()
#     if not row:
#         return jsonify({'error': 'Assessment not found'}), 404
#     assessment_id = row['id']

#     # Delete existing questions + choices
#     cursor.execute("SELECT id FROM questions WHERE assessment_id = ?", (assessment_id,))
#     question_ids = [r['id'] for r in cursor.fetchall()]
#     for qid in question_ids:
#         cursor.execute("DELETE FROM choices WHERE question_id = ?", (qid,))
#     cursor.execute("DELETE FROM questions WHERE assessment_id = ?", (assessment_id,))

#     # Re-insert all updated questions
#     for q in questions:
#         cursor.execute("""
#             INSERT INTO questions (text, correct_answer, score, assessment_id)
#             VALUES (?, ?, ?, ?)
#         """, (q['text'], q['correct'], q.get('score', 1), assessment_id))
#         new_qid = cursor.lastrowid

#         for opt in q.get('options', []):
#             cursor.execute("INSERT INTO choices (question_id, choice_text) VALUES (?, ?)", (new_qid, opt))

#     conn.commit()
#     conn.close()
#     return jsonify({'message': 'Assessment updated successfully'})

# ─── Assessment Management for TeacherEditAssessments.js ────────────────

@teacher_routes.route('/assessments', methods=['GET'])
def get_all_assessments():
    conn = get_db()
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

@teacher_routes.route('/assessments', methods=['POST'])
def add_assessment():
    data = request.get_json()
    title = data.get("title")
    content_domain_id = data.get("content_domain_id")
    bif_file = data.get("bif_file")
    competency_node = data.get("competency_node")
    if not title or not content_domain_id:
        return jsonify({'error': 'Missing title or content_domain_id'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO assessments (title, content_domain_id, bif_file, competency_node) VALUES (?, ?, ?, ?)",
        (title, content_domain_id, bif_file, competency_node)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment added."})

@teacher_routes.route('/assessment/<title>', methods=['PATCH'])
def update_assessment(title):
    data = request.get_json()
    new_title = data.get("newTitle")
    content_domain_id = data.get("content_domain_id")
    bif_file = data.get("bif_file")
    competency_node = data.get("competency_node")
    
    conn = get_db()
    cursor = conn.cursor()

    # Build the update query dynamically
    updates = []
    params = []

    if new_title:
        updates.append("title = ?")
        params.append(new_title)
    
    if content_domain_id is not None:
        updates.append("content_domain_id = ?")
        params.append(content_domain_id)

    # --- FIX: Correctly handle bif_file and competency_node updates ---
    if bif_file is not None:
        updates.append("bif_file = ?")
        params.append(bif_file)

    if competency_node is not None:
        updates.append("competency_node = ?")
        params.append(competency_node)
    # --- END FIX ---

    if not updates:
        conn.close()
        return jsonify({"message": "No update data provided."})

    # Add the original title to the end of params for the WHERE clause
    params.append(title)

    # Update using the collected fields
    query = f"UPDATE assessments SET {', '.join(updates)} WHERE title = ?"
    cursor.execute(query, tuple(params))
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment updated."})

@teacher_routes.route('/assessment/<title>', methods=['DELETE'])
def delete_assessment(title):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Assessment not found'}), 404
    assessment_id = row['id']
    # Delete questions and choices
    cursor.execute("SELECT id FROM questions WHERE assessment_id = ?", (assessment_id,))
    question_ids = [r['id'] for r in cursor.fetchall()]
    for qid in question_ids:
        cursor.execute("DELETE FROM choices WHERE question_id = ?", (qid,))
    cursor.execute("DELETE FROM questions WHERE assessment_id = ?", (assessment_id,))
    # Delete assessment
    cursor.execute("DELETE FROM assessments WHERE id = ?", (assessment_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment deleted."})

@teacher_routes.route('/assessment/<title>', methods=['GET'])
def get_questions(title):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify([])
    assessment_id = row['id']
    cursor.execute("""
        SELECT q.id, q.text, q.correct_answer, q.score
        FROM questions q
        WHERE q.assessment_id = ?
        LIMIT 10
    """, (assessment_id,))
    questions = [dict(row) for row in cursor.fetchall()]
    for q in questions:
        cursor.execute("SELECT choice_text FROM choices WHERE question_id = ?", (q['id'],))
        q['options'] = [c['choice_text'] for c in cursor.fetchall()]
        q['pinned'] = False;
        q['comments'] = []
        q['correct'] = q.pop('correct_answer', '')
    conn.close()
    return jsonify(questions)

@teacher_routes.route('/assessment/<title>', methods=['POST'])
def save_questions(title):
    data = request.get_json()
    questions = data.get('questions', [])
    if len(questions) > 10:
        return jsonify({'error': 'Maximum 10 questions allowed per assessment.'}), 400
    conn = get_db()
    cursor = conn.cursor()
    # Get assessment ID
    cursor.execute("SELECT id FROM assessments WHERE title = ?", (title,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Assessment not found'}), 404
    assessment_id = row['id']
    # Delete existing questions + choices
    cursor.execute("SELECT id FROM questions WHERE assessment_id = ?", (assessment_id,))
    question_ids = [r['id'] for r in cursor.fetchall()]
    for qid in question_ids:
        cursor.execute("DELETE FROM choices WHERE question_id = ?", (qid,))
    cursor.execute("DELETE FROM questions WHERE assessment_id = ?", (assessment_id,))
    # Re-insert all updated questions
    for q in questions:
        try:
            print("Saving question:", q)  # Add this line for debugging
            # Fallback: use q.get('correct') or first option if missing
            correct = q.get('correct') or (q.get('options') or [""])[0]
            cursor.execute("""
                INSERT INTO questions (text, correct_answer, score, assessment_id)
                VALUES (?, ?, ?, ?)
            """, (q['text'], correct, q.get('score', 1), assessment_id))
            new_qid = cursor.lastrowid
            for opt in q.get('options', []):
                cursor.execute("INSERT INTO choices (question_id, choice_text) VALUES (?, ?)", (new_qid, opt))
        except Exception as e:
            conn.rollback()
            conn.close()
            print("Error saving question:", q, e)
            return jsonify({'error': f'Failed to save question: {str(e)}', 'question': q}), 500
    conn.commit()
    conn.close()
    return jsonify({'message': 'Assessment updated successfully'})

@teacher_routes.route('/manual-query', methods=['POST'])
def manual_query():
    data = request.get_json() or {}
    bif_file = data.get('bif_file')
    competency = data.get('competency')
    score = data.get('score')
    total = data.get('total', 10)

    if score is None:
        return jsonify({'error': 'Missing score for manual query'}), 400

    # Run the manual query
    result, error = run_manual_query(bif_file, competency, score, total)
    if error:
        lower_error = error.lower()
        status = 404 if ('not found' in lower_error or 'not loaded' in lower_error) else 400
        return jsonify({'error': error}), status

    # Fetch related competencies and their probabilities
    model, inference = get_model(bif_file)
    related_competencies = model.get_children(competency) + [competency]
    query_result = inference.query(variables=related_competencies, show_progress=False)
    probabilities = {comp: query_result[comp].values[1] for comp in related_competencies}

    return jsonify({
        'mastery_probabilities': probabilities,
        'score': score,
        'total': total
    })


@teacher_routes.route('/auto-query-result/<int:result_id>', methods=['GET'])
def auto_query_result(result_id):
    result, error = run_auto_query(result_id)
    if error:
        lower_error = error.lower()
        status = 404 if ('not found' in lower_error or 'not loaded' in lower_error) else 400
        return jsonify({'error': error}), status

    # Fetch related competencies and their probabilities
    bif_file = result.get('bif_file')
    competency = result.get('competency')
    model, inference = get_model(bif_file)
    related_competencies = model.get_children(competency) + [competency]
    query_result = inference.query(variables=related_competencies, show_progress=False)
    probabilities = {comp: query_result[comp].values[1] for comp in related_competencies}

    return jsonify({
        'mastery_probabilities': probabilities,
        'score': result.get('score'),
        'total': result.get('total')
    })


@teacher_routes.route('/results/<student_id>', methods=['GET'])
def get_teacher_student_results(student_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sr.id as result_id,
               sr.submitted_at AS date,
               a.title AS examName,
               sr.score,
               sr.total,
               (CAST(sr.score AS REAL) / sr.total) * 100 AS percentage
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE sr.student_id = ?
        ORDER BY sr.submitted_at DESC
    """, (student_id,))
    results = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in results])

@teacher_routes.route('/query-result/<int:result_id>', methods=['GET'])
def query_result(result_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.title AS competency, sr.score, sr.total
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        LEFT JOIN competencies c ON c.title = a.title
        WHERE sr.id = ?
    """, (result_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Result not found'}), 404

    competency = row['competency']
    score = row['score']
    total = row['total']
    mastery_prob = score / total if total else 0

    try:
        result = inference.query(variables=[competency], show_progress=False)
        prob = result.values.item() if result.values.shape == () else result.values[1]
        return jsonify({
            'competency': competency,
            'score': score,
            'total': total,
            'mastery_probability': prob
        })
    
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teacher_routes.route('/unassign', methods=['POST'])
def unassign_competency():
    data = request.get_json()
    student_id = data.get('studentId')
    competency_id = data.get('competencyId')
    tutor_id = data.get('tutorId')

    if not student_id or not competency_id or not tutor_id:
        return jsonify({'error': 'Missing data'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM assignments WHERE student_id = ? AND competency_id = ? AND tutor_id = ?',
        (student_id, competency_id, tutor_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Assignment removed'})




