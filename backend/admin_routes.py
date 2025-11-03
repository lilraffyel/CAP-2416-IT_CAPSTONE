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
import os
import numpy as np
import io
from flask import Blueprint, request, jsonify
from database import get_db_connection
from pgmpy.readwrite.BIF import BIFReader, BIFWriter
from pgmpy.factors.discrete import TabularCPD
# Import the new cache management functions
from prerequisite.prerequisite_api import get_model, clear_model_cache

admin_routes = Blueprint('admin_routes', __name__)

# This helper is no longer needed, we will use get_model()
# def reload_bif_from_db(network_name): ...

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
@admin_routes.route('/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM users WHERE role = 'Student'")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(students)

@admin_routes.route('/assign-tutor', methods=['POST'])
def assign_tutor():
    data = request.json
    print('Received data:', data)  # Add this line
    student_id = data.get('studentId')
    tutor_id = data.get('tutorId')

    if not student_id or not tutor_id:
        return jsonify({'error': 'studentId and tutorId are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # --- FIX: Prevent duplicate assignments for the same student-tutor pair ---
    cursor.execute("""
        SELECT 1 FROM tutor_assignments WHERE student_id = ? AND tutor_id = ?
    """, (student_id, tutor_id))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'This tutor is already assigned to this student.'}), 400

    cursor.execute("""
        INSERT INTO tutor_assignments (student_id, tutor_id)
        VALUES (?, ?)
    """, (student_id, tutor_id))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Tutor assigned successfully!'})


@admin_routes.route('/tutor-assignments', methods=['GET'])
def get_tutor_assignments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ta.id,
               ta.student_id,
               s.name as student_name,
               ta.tutor_id,
               t.name as tutor_name,
               ta.help_request_id,
               ta.domain_id,
               ta.assigned_at
        FROM tutor_assignments ta
        JOIN users s ON ta.student_id = s.id
        JOIN users t ON ta.tutor_id = t.id
        LEFT JOIN help_requests hr ON ta.help_request_id = hr.id
        LEFT JOIN content_domains cd ON hr.domain_id = cd.id
        ORDER BY ta.assigned_at DESC
    """)
    assignments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(assignments)

@admin_routes.route('/unassign-tutor', methods=['POST'])
def unassign_tutor():
    data = request.json
    student_id = data.get('studentId')
    tutor_id = data.get('tutorId')
    if not student_id or not tutor_id:
        return jsonify({'error': 'studentId and tutorId are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM tutor_assignments WHERE student_id = ? AND tutor_id = ?",
        (student_id, tutor_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Tutor unassigned successfully!'})

@admin_routes.route('/remove-help-request', methods=['POST'])
def remove_help_request():
    data = request.json
    help_request_id = data.get('helpRequestId')
    if not help_request_id:
        return jsonify({'error': 'helpRequestId is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM help_requests WHERE id = ?", (help_request_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Help request removed successfully!'})




@admin_routes.route("/get_cpds", methods=["GET"])
def get_cpds():
    network = request.args.get("network")
    if not network:
        return jsonify({"error": "Network name is required."}), 400
    try:
        # Use the lazy-loading function
        model_data = get_model(network)
        if not model_data:
            return jsonify({"error": f"BIF file '{network}' not found or failed to load."}), 404
        
        model = model_data["model"]
        cpds = {}
        for cpd in model.get_cpds():
            is_singular = not cpd.variables[1:]
            
            # For singular nodes, pgmpy might give [[0.7, 0.3]]. Flatten it.
            # For complex nodes, transpose the values for correct display.
            values = np.array(cpd.values)
            processed_values = values.flatten().tolist() if is_singular else values.T.tolist()

            cpds[cpd.variable] = {
                "values": processed_values,
                "evidence": cpd.variables[1:]
            }
        return jsonify({"cpds": cpds, "message": "CPDs retrieved successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_routes.route("/update_cpd", methods=["POST"])
def update_cpd():
    data = request.get_json()
    network = data.get("network", "network.bif")
    variable = data["variable"]
    values = data["values"]
    evidence = data.get("evidence", [])
    network_path = os.path.join(os.path.dirname(__file__), "prerequisite", network)
    try:
        # Validate that each row sums to 1
        for row in values:
            if abs(sum(row) - 1) > 1e-6:
                return jsonify({"error": "Each row of CPD values must sum to 1."}), 400

        bif_reader, model = reload_bif(network_path)
        evidence_card = [2] * len(evidence) if evidence else None
        state_names = {variable: [0, 1], **{parent: [0, 1] for parent in evidence}}
        cpd = TabularCPD(
            variable=variable,
            variable_card=2,
            values=values,
            evidence=evidence if evidence else None,
            evidence_card=evidence_card,
            state_names=state_names
        )
        model.add_cpds(cpd)
        model.check_model()
        writer = BIFWriter(model)
        writer.write_bif(network_path)
        reload_bif(network_path)
        return jsonify({"message": "CPD updated/added successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@admin_routes.route("/delete_cpd", methods=["POST"])
def delete_cpd():
    data = request.get_json()
    network = data.get("network", "network.bif")
    variable = data["variable"]
    network_path = os.path.join(os.path.dirname(__file__), "prerequisite", network)
    try:
        bif_reader, model = reload_bif(network_path)
        model.remove_cpds(variable)
        model.check_model()
        writer = BIFWriter(model)
        writer.write_bif(network_path)
        reload_bif(network_path)
        return jsonify({"message": "CPD deleted successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_routes.route("/batch_update_cpds", methods=["POST"])
def batch_update_cpds():
    import numpy as np
    from collections import defaultdict
    from pgmpy.models import BayesianNetwork

    changes = request.get_json().get("changes", [])
    results = []
    
    grouped_changes = defaultdict(list)
    for change in changes:
        network = change.get("network")
        if network:
            grouped_changes[network].append(change)
        else:
            results.append("Error: Found a change item missing the 'network' property.")

    for network, network_changes in grouped_changes.items():
        try:
            model_data = get_model(network)
            if not model_data:
                model = BayesianNetwork()
            else:
                model = model_data["model"]

            for change in network_changes:
                if change["type"] == "update":
                    variable = change["variable"]
                    values = change.get("values", [])
                    evidence = change.get("evidence", [])

                    try:
                        values_np = np.array(values, dtype=float)
                    except ValueError:
                        results.append(f"Error for {variable}: 'values' field contains non-numeric data.")
                        continue

                    if values_np.ndim == 1:
                        if not evidence:
                            values_np = values_np.reshape(-1, 1)
                        else:
                            results.append(f"Error for {variable}: Values for complex node must be 2D.")
                            continue
                    elif values_np.ndim != 2:
                        results.append(f"Error for {variable}: Values must be a 2D array.")
                        continue

                    # Prepare values for pgmpy (transpose for complex nodes to match pgmpy's column-major expectation)
                    if not evidence:
                        values_for_pgmpy = values_np  # Already (2, 1)
                        if values_for_pgmpy.shape != (2, 1):
                            results.append(f"Error for singular node {variable}: Expected shape (2, 1), got {values_for_pgmpy.shape}.")
                            continue
                    else:
                        values_for_pgmpy = values_np.T  # Transpose to (2, num_parent_combos)
                        num_parent_combos = 2 ** len(evidence)
                        if values_for_pgmpy.shape != (2, num_parent_combos):
                            results.append(f"Error for {variable}: Transposed shape {values_for_pgmpy.shape} doesn't match expected (2, {num_parent_combos}).")
                            continue

                    # Validate probabilities sum to 1 BEFORE modifying the model
                    if not evidence:
                        if not np.isclose(values_for_pgmpy.sum(), 1.0):
                            results.append(f"Error for {variable}: Probabilities do not sum to 1.")
                            continue
                    else:
                        if not np.all(np.isclose(values_for_pgmpy.sum(axis=0), 1.0)):
                            results.append(f"Error for {variable}: Each column must sum to 1.")
                            continue

                    # Now modify the model
                    if variable not in model.nodes:
                        model.add_node(variable)
                    for parent in evidence:
                        if parent not in model.nodes:
                            model.add_node(parent)
                        if not model.has_edge(parent, variable):
                            model.add_edge(parent, variable)

                    # Remove existing CPD if it exists
                    existing_cpds = [cpd for cpd in model.get_cpds() if cpd.variable == variable]
                    if existing_cpds:
                        model.remove_cpds(variable)

                    # State names
                    all_model_nodes = list(model.nodes())
                    cpd_state_names = {node: ['0', '1'] for node in all_model_nodes}

                    # Create and add CPD
                    evidence_card = [2] * len(evidence) if evidence else None
                    cpd = TabularCPD(
                        variable=variable,
                        variable_card=2,
                        values=values_for_pgmpy.tolist(),
                        evidence=evidence if evidence else None,
                        evidence_card=evidence_card,
                        state_names=cpd_state_names
                    )
                    model.add_cpds(cpd)
                    results.append(f"Queued update/add for {variable}.")

                elif change["type"] == "delete":
                    variable = change["variable"]
                    if variable in model.nodes:
                        model.remove_node(variable)
                        results.append(f"Queued delete for {variable}.")
                    else:
                        results.append(f"Skipped delete for {variable}: Not found in model.")

            model.check_model()
            writer = BIFWriter(model)
            new_content = str(writer)
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE bayesian_networks SET content = ? WHERE name = ?", (new_content, network))
            conn.commit()
            conn.close()
            
            clear_model_cache(network)
            results.append(f"Successfully saved and cleared cache for {network}.")

        except Exception as e:
            results.append(f"Error processing network {network}: {str(e)}")
    
    return jsonify({"message": "Batch update complete. " + "; ".join(results)})

@admin_routes.route('/networks', methods=['GET'])
def get_networks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM bayesian_networks ORDER BY name")
    networks = [row['name'] for row in cursor.fetchall()]
    conn.close()
    return jsonify(networks)