from flask import Blueprint, request, jsonify
import sqlite3

teacher_routes = Blueprint('teacher_routes', __name__)

def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# ─── Student and Domain Info ─────────────────────────────────────────────

@teacher_routes.route('/students', methods=['GET'])
def get_students():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role = 'Student'")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.title AS label, cd.name AS domain, c.content_domain_id
        FROM competencies c
        JOIN content_domains cd ON c.content_domain_id = cd.id
    """)
    competencies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(competencies)

# ─── Assignment API ─────────────────────────────────────────────────────

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
    """, (assessment_id,))
    questions = [dict(row) for row in cursor.fetchall()]

    for q in questions:
        cursor.execute("SELECT choice_text FROM choices WHERE question_id = ?", (q['id'],))
        q['choices'] = [c['choice_text'] for c in cursor.fetchall()]
        del q['correct_answer']  # remove answer before sending

    conn.close()
    return jsonify({'title': title, 'questions': questions})

# ─── Submitting Assessment ───────────────────────────────────────────────

@teacher_routes.route('/submit-assessment', methods=['POST'])
def submit_assessment():
    data = request.json
    student_id = data.get('studentId')
    assessment_title = data.get('assessmentTitle')
    answers = data.get('answers')  # {question_id: selected_choice}

    if not student_id or not assessment_title or not answers:
        return jsonify({'error': 'Missing data'}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM assessments WHERE title = ?", (assessment_title,))
    assessment_row = cursor.fetchone()
    if not assessment_row:
        conn.close()
        return jsonify({'error': 'Assessment not found'}), 404

    assessment_id = assessment_row['id']
    score = 0
    total = 0

    for qid_str, student_answer in answers.items():
        try:
            qid = int(qid_str)
        except ValueError:
            continue
        cursor.execute("SELECT correct_answer, score FROM questions WHERE id = ?", (qid,))
        row = cursor.fetchone()
        if row:
            total += row['score']
            if student_answer.strip() == row['correct_answer'].strip():
                score += row['score']

    # ✅ Calculate next attempt number
    cursor.execute("""
        SELECT COUNT(*) FROM student_results
        WHERE student_id = ? AND assessment_id = ?
    """, (student_id, assessment_id))
    attempt_number = cursor.fetchone()[0] + 1

    # ✅ Insert with attempt_number
    cursor.execute("""
        INSERT INTO student_results (student_id, assessment_id, score, total, attempt_number)
        VALUES (?, ?, ?, ?, ?)
    """, (student_id, assessment_id, score, total, attempt_number))

    conn.commit()
    conn.close()
    return jsonify({
        'message': f'Submission complete. You scored {score}/{total}!',
        'score': score,
        'total': total,
        'attempt': attempt_number
    })


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
#         q['pinned'] = False
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
        SELECT a.title, a.bif_file, cd.name AS domain, a.content_domain_id
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
            "content_domain_id": row['content_domain_id']
        })
    conn.close()
    return jsonify(result)

@teacher_routes.route('/assessments', methods=['POST'])
def add_assessment():
    data = request.get_json()
    title = data.get("title")
    content_domain_id = data.get("content_domain_id")
    bif_file = data.get("bif_file")
    if not title or not content_domain_id:
        return jsonify({'error': 'Missing title or content_domain_id'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO assessments (title, content_domain_id, bif_file) VALUES (?, ?, ?)",
        (title, content_domain_id, bif_file)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment added."})

@teacher_routes.route('/assessment/<title>', methods=['PATCH'])
def update_assessment(title):
    data = request.get_json()
    content_domain_id = data.get("content_domain_id")
    bif_file = data.get("bif_file")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE assessments SET content_domain_id = ?, bif_file = ? WHERE title = ?",
        (content_domain_id, bif_file, title)
    )
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
        q['pinned'] = False
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

@teacher_routes.route('/auto-query-result/<student_id>/<int:assessment_id>', methods=['GET'])
def auto_query_result(student_id, assessment_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sr.score, sr.total, c.id AS competency_node, a.bif_file
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        JOIN competencies c ON c.title = a.title
        WHERE sr.student_id = ? AND sr.assessment_id = ?
        ORDER BY sr.attempt_number DESC
        LIMIT 1
    """, (student_id, assessment_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Result not found'}), 404

    competency_node = row['competency_node']
    score = row['score']
    total = row['total']
    bif_file = row['bif_file'] or "network.bif"

    # Use the loaded model from prerequisite_api.py
    model_data = LOADED_MODELS.get(bif_file)
    if not model_data:
        return jsonify({'error': f"BIF file '{bif_file}' not loaded"}), 404

    model = model_data["model"]
    infer = model_data["infer"]

    # Use the same logic as assess_competencies
    try:
        score_val = float(score)
        if score_val < 7:
            # Use determine_next_focus from prerequisite_api.py
            from prerequisite.prerequisite_api import determine_next_focus
            outcome = determine_next_focus(model, infer, competency_node)
            result = {
                "competency": competency_node,
                "score": score,
                "total": total,
                "next_focus": outcome.get("next_focus"),
                "mastery_probabilities": outcome.get("mastery_probabilities"),
            }
        else:
            result = {
                "competency": competency_node,
                "score": score,
                "total": total,
                "next_focus": None,
                "mastery_probabilities": None,
            }
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@teacher_routes.route('/results/<student_id>', methods=['GET'])
def get_teacher_student_results(student_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT sr.id as result_id,
               sr.submitted_at AS date,
               a.title AS examName,
               sr.score,
               sr.student_id,
               sr.assessment_id
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
    
    
