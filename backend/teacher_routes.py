from flask import Blueprint, request, jsonify
from database import get_db_connection
# Import the new lazy-loading function and remove unused LOADED_MODELS
from prerequisite.prerequisite_api import get_model, determine_next_focus

teacher_routes = Blueprint('teacher_routes', __name__)

# ─── Student and Domain Info ─────────────────────────────────────────────

@teacher_routes.route('/students', methods=['GET'])
def get_students():
    tutor_id = request.args.get('tutor_id')
    conn = get_db_connection()
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

'''
@teacher_routes.route('/students', methods=['GET'])
def get_students():
    tutor_id = request.args.get('tutor_id')  # get tutor_id from query param
    print("Received tutor_id:", tutor_id)

    if not tutor_id:
        return jsonify({'error': 'Missing tutor_id'}), 400

    conn = get_db_connection()
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
    conn = get_db_connection()
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
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM content_domains")
    domains = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(domains)

@teacher_routes.route('/competencies', methods=['GET'])
def get_competencies():
    conn = get_db_connection()
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
@teacher_routes.route('/assignments', methods=['GET'])
def get_assignments():
    conn = get_db_connection()
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

    conn = get_db_connection()
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
    conn = get_db_connection()
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
    conn = get_db_connection()
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

# ─── Submitting Assessment ───────────────────────────────────────────────

@teacher_routes.route('/submit-assessment', methods=['POST'])
def submit_assessment():
    data = request.json
    student_id = data.get('studentId')
    assessment_title = data.get('assessmentTitle')
    answers = data.get('answers')  # {question_id: selected_choice}

    if not student_id or not assessment_title or not answers:
        return jsonify({'error': 'Missing data'}), 400

    conn = get_db_connection()
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
    conn = get_db_connection()
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

    conn = get_db_connection()
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
    conn = get_db_connection()
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
    conn = get_db_connection()
    cursor = conn.cursor()
    # ✅ Join with bayesian_networks to get the bif_file name from bif_id
    cursor.execute("""
        SELECT a.title, bn.name AS bif_file, cd.name AS domain, a.content_domain_id
        FROM assessments a
        LEFT JOIN content_domains cd ON a.content_domain_id = cd.id
        LEFT JOIN bayesian_networks bn ON a.bif_id = bn.id
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
    bif_file = data.get("bif_file") # This is the filename string from the frontend
    if not title or not content_domain_id:
        return jsonify({'error': 'Missing title or content_domain_id'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ Look up the bif_id from the bayesian_networks table
    bif_id = None
    if bif_file:
        cursor.execute("SELECT id FROM bayesian_networks WHERE name = ?", (bif_file,))
        bif_row = cursor.fetchone()
        if bif_row:
            bif_id = bif_row['id']

    # ✅ Insert using bif_id
    cursor.execute(
        "INSERT INTO assessments (title, content_domain_id, bif_id) VALUES (?, ?, ?)",
        (title, content_domain_id, bif_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment added."})

@teacher_routes.route('/assessment/<title>', methods=['PATCH'])
def update_assessment(title):
    data = request.get_json()
    content_domain_id = data.get("content_domain_id")
    bif_file = data.get("bif_file") # Filename string from frontend
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ Look up the bif_id from the bayesian_networks table
    bif_id = None
    if bif_file:
        cursor.execute("SELECT id FROM bayesian_networks WHERE name = ?", (bif_file,))
        bif_row = cursor.fetchone()
        if bif_row:
            bif_id = bif_row['id']

    # ✅ Update using bif_id
    cursor.execute(
        "UPDATE assessments SET content_domain_id = ?, bif_id = ? WHERE title = ?",
        (content_domain_id, bif_id, title)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Assessment updated."})

@teacher_routes.route('/assessment/<title>', methods=['DELETE'])
def delete_assessment(title):
    conn = get_db_connection()
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
    conn = get_db_connection()
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
    conn = get_db_connection()
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
    data = request.get_json()
    bif_file = data.get('bif_file')
    competency_node = data.get('competency')
    score = data.get('score')
    total = data.get('total') # --- FIX: Get total from request ---

    if not all([bif_file, competency_node, score is not None, total is not None]):
        return jsonify({'error': 'Missing bif_file, competency, score, or total'}), 400

    # Use the lazy-loading function from prerequisite_api
    model_data = get_model(bif_file)
    if not model_data:
        return jsonify({'error': f"BIF file '{bif_file}' not found or failed to load"}), 404

    model = model_data["model"]
    infer = model_data["infer"]

    # --- FIX: Calculate evidence_state from score and total, just like auto-query ---
    try:
        score = int(score)
        total = int(total)
        mastery_threshold = 0.7 
        evidence_state = 1 if (score / total) >= mastery_threshold else 0
    except (ValueError, ZeroDivisionError):
        return jsonify({'error': 'Invalid score or total provided.'}), 400

    # If the competency was 'mastered', no focus is needed.
    if evidence_state == 1:
        return jsonify({
            "competency": competency_node,
            "score": score,
            "total": total,
            "next_focus": "Competency mastered, no immediate focus needed."
        })

    # Call the existing logic to determine the next focus area
    outcome = determine_next_focus(model, infer, competency_node, evidence_state)

    return jsonify({
        "competency": competency_node,
        "score": score,
        "total": total,
        **outcome  # Unpack the outcome dictionary (next_focus, mastery_probabilities)
    })

@teacher_routes.route('/auto-query-result/<int:result_id>', methods=['GET'])
def auto_query_result(result_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # --- FIX: Query by the unique result_id ---
    cursor.execute("""
        SELECT sr.score, sr.total, c.title AS competency_node, bn.name AS bif_file
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        LEFT JOIN competencies c ON c.title = a.title
        LEFT JOIN bayesian_networks bn ON a.bif_id = bn.id
        WHERE sr.id = ?
    """, (result_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Result not found'}), 404

    competency_node = row['competency_node']
    score = row['score']
    total = row['total']
    bif_file = row['bif_file']

    # --- START DEBUGGING ---
    print("\n--- AUTO-QUERY DEBUG ---")
    print(f"  - BIF File: {bif_file}")
    print(f"  - Competency Node: {competency_node}")
    print(f"  - Score/Total: {score}/{total}")
    # --- END DEBUGGING ---

    if not bif_file:
        return jsonify({'error': 'Assessment is not linked to a Bayesian Network'}), 404

    # Use the lazy-loading function
    model_data = get_model(bif_file)
    if not model_data:
        return jsonify({'error': f"BIF file '{bif_file}' not found or failed to load"}), 404

    model = model_data["model"]
    infer = model_data["infer"]

    # Determine the evidence state based on the score
    # Assuming a 70% threshold for mastery (state 1)
    mastery_threshold = 0.7 
    evidence_state = 1 if (score / total) >= mastery_threshold else 0

    # --- START DEBUGGING ---
    print(f"  - Calculated Evidence State: {evidence_state} (Type: {type(evidence_state)})")
    print(f"  - Calling determine_next_focus with: model, infer, '{competency_node}', {evidence_state}")
    print("------------------------\n")
    # --- END DEBUGGING ---

    # If the student passed, there's no need to find a focus area.
    if evidence_state == 1:
        return jsonify({
            "competency": competency_node,
            "score": score,
            "total": total,
            "next_focus": "Competency mastered, no immediate focus needed."
        })

    # ✅ Pass the model, infer, node, AND the evidence state to the function
    outcome = determine_next_focus(model, infer, competency_node, evidence_state)

    return jsonify({
        "competency": competency_node,
        "score": score,
        "total": total,
        **outcome  # Unpack the outcome dictionary (next_focus, mastery_probabilities, etc.)
    })


@teacher_routes.route('/results/<student_id>', methods=['GET'])
def get_teacher_student_results(student_id):
    conn = get_db_connection()
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
    conn = get_db_connection()
    cursor = conn.cursor()
    # Also fetch the bif_file name associated with this result
    cursor.execute("""
        SELECT c.title AS competency, sr.score, sr.total, bn.name as bif_file
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        LEFT JOIN competencies c ON c.title = a.title
        LEFT JOIN bayesian_networks bn ON a.bif_id = bn.id
        WHERE sr.id = ?
    """, (result_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Result not found'}), 404

    competency = row['competency']
    bif_file = row['bif_file']

    if not bif_file or not competency:
        return jsonify({'error': 'Result is not linked to a valid competency or Bayesian Network'}), 400

    # Use the lazy-loading function
    model_data = get_model(bif_file)
    if not model_data:
        return jsonify({'error': f"Model '{bif_file}' not loaded."}), 500
    
    infer = model_data["infer"]

    try:
        # Use the correct inference engine
        result = infer.query(variables=[competency], show_progress=False)
        prob = result.values.item() if result.values.shape == () else result.values[1]
        return jsonify({
            'competency': competency,
            'score': row['score'],
            'total': row['total'],
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

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM assignments WHERE student_id = ? AND competency_id = ? AND tutor_id = ?',
        (student_id, competency_id, tutor_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Assignment removed'})

