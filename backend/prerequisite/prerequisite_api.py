from flask import Blueprint, request, jsonify
from pgmpy.readwrite import BIFReader, BIFWriter
from pgmpy.inference import VariableElimination
from pgmpy.factors.discrete import TabularCPD
import numpy as np
import io
from database import get_db_connection

prereq_bp = Blueprint('prereq', __name__)

# This dictionary now acts as our in-memory cache.
LOADED_MODELS = {}

def get_model(filename):
    """
    Lazily loads a Bayesian Network from the database into the cache if not already present.
    Returns the model and inference engine.
    """
    # 1. Cache Hit: If model is already loaded, return it immediately.
    if filename in LOADED_MODELS:
        print(f"✅ Cache HIT for: {filename}")
        return LOADED_MODELS[filename]

    # 2. Cache Miss: If not loaded, fetch from DB.
    print(f"⚠️ Cache MISS for: {filename}. Loading from DB...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT content FROM bayesian_networks WHERE name = ?", (filename,))
        network = cursor.fetchone()
        conn.close()

        if not network:
            raise FileNotFoundError(f"Network '{filename}' not found in the database.")

        bif_reader = BIFReader(string=network['content'])
        model = bif_reader.get_model()
        model.check_model()
        infer = VariableElimination(model)

        # 3. Store the newly loaded model in the cache.
        LOADED_MODELS[filename] = {"model": model, "infer": infer}
        print(f"👍 Loaded and cached: {filename}")
        
        return LOADED_MODELS[filename]

    except Exception as e:
        print(f"❌ Error loading '{filename}' from DB: {e}")
        return None

def clear_model_cache(filename=None):
    """Clears the entire model cache, or just a specific model."""
    if filename:
        if filename in LOADED_MODELS:
            del LOADED_MODELS[filename]
            print(f"🔥 Cache cleared for: {filename}")
    else:
        LOADED_MODELS.clear()
        print("🔥 Entire model cache cleared.")

# We no longer eagerly load all files on startup.
# BIF_LOAD_ERRORS = load_bif_files()

@prereq_bp.route('/biffiles', methods=['GET'])
def list_bif_files():
    # List files directly from the database, not from the cache.
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM bayesian_networks")
        files = [row['name'] for row in cursor.fetchall()]
        conn.close()
        return jsonify({"bif_files": files})
    except Exception as e:
        return jsonify({"error": f"Database error: {e}"}), 500

@prereq_bp.route("/competencies", methods=["GET"])
def get_competencies():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    # Use the lazy-loading function
    model_data = get_model(filename)
    if not model_data:
        return jsonify({"error": f"BIF file '{filename}' not found or failed to load"}), 404

    model = model_data["model"]
    nodes = list(model.nodes())
    return jsonify({"competencies": nodes})

@prereq_bp.route("/assess", methods=["POST"])
def assess_competencies():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    # Use the lazy-loading function
    model_data = get_model(filename)
    if not model_data:
        return jsonify({"error": f"BIF file '{filename}' not found"}), 404

    data = request.get_json()
    if not data or "tested" not in data:
        return jsonify({"error": "Missing 'tested' in request body"}), 400

    tested = data.get("tested", [])
    model = model_data["model"]
    infer = model_data["infer"]

    results = []
    for item in tested:
        comp = item.get("competency")
        score = item.get("score")
        if not comp or score is None:
            results.append({"competency": comp, "score": score, "error": "Invalid competency or score"})
            continue
        try:
            score = float(score)
            if score < 7:
                # ✅ FIX: Pass the evidence state as 0 for the manual query.
                # The determine_next_focus function will handle converting it to a string.
                outcome = determine_next_focus(model, infer, comp, 0)
                results.append({
                    "competency": comp,
                    "score": score,
                    "next_focus": outcome.get("next_focus"),
                    "mastery_probabilities": outcome.get("mastery_probabilities")
                })
            else:
                results.append({
                    "competency": comp,
                    "score": score,
                    "next_focus": None,
                    "mastery_probabilities": None
                })
        except Exception as e:
            results.append({"competency": comp, "score": score, "error": f"Failed to assess: {e}"})

    return jsonify({"assessment_results": results})

def determine_next_focus(model, infer, failed_competency, student_id, domain_id, evidence_state=0):
    """
    Determines the most likely prerequisite to focus on, excluding already passed competencies.
    evidence_state defaults to 0 (not mastered).
    """
    if failed_competency not in model.nodes():
        return {"next_focus": None, "error": f"Competency '{failed_competency}' not in model"}

    # --- NEW: Get already passed competencies for the student ---
    passed_competencies = set()
    if student_id and domain_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT competency_node FROM student_progress WHERE student_id = ? AND domain_id = ? AND actual_mastery = ?",
                (student_id, domain_id, "✔ Pass")
            )
            passed_competencies = {row['competency_node'] for row in cursor.fetchall()}
            conn.close()
        except Exception as e:
            print(f"Could not fetch student progress: {e}")
    # --- END NEW ---

    prerequisites = model.get_parents(failed_competency)
    
    # --- NEW: Filter out passed prerequisites ---
    eligible_prerequisites = [p for p in prerequisites if p not in passed_competencies]
    # --- END NEW ---

    if not eligible_prerequisites:
        # If all prerequisites are passed or there are no prerequisites, suggest reviewing the failed topic.
        return {"next_focus": f"All prerequisites seem to be mastered. Please review '{failed_competency}' again."}
    
    if len(eligible_prerequisites) == 1:
        return {"next_focus": eligible_prerequisites[0]}

    prob_dict = {}
    for pre in eligible_prerequisites:
        try:
            # ✅ FIX: The evidence value MUST be a string to match the BIF state names ('0', '1').
            evidence_dict = {failed_competency: str(evidence_state)}
            
            print(f"  - [determine_next_focus] Querying for '{pre}' with evidence: {evidence_dict}")

            # Query for the probability of the prerequisite being mastered (state 1)
            # given the evidence that the dependent competency was in a specific state.
            result = infer.query(variables=[pre], evidence=evidence_dict)
            # The probability of being in state '1' (mastered)
            prob_dict[pre] = result.values[1]
        except Exception as e:
            print(f"Error inferring for {pre}: {e}")

    if prob_dict:
        weakest = min(prob_dict, key=prob_dict.get)
        return {"next_focus": weakest, "mastery_probabilities": prob_dict}
        
    return {"next_focus": eligible_prerequisites[0]}

@prereq_bp.route("/cpds", methods=["GET"])
def get_cpds():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    model_data = LOADED_MODELS.get(filename)
    if not model_data:
        return jsonify({"error": f"BIF file '{filename}' not found"}), 404

    model = model_data["model"]
    cpds = {}
    meta = {}
    try:
        for cpd in model.get_cpds():
            parents = model.get_parents(cpd.variable)
            parent_values = []
            for parent in parents:
                state_names = model.get_cpds(parent).state_names.get(parent, [str(i) for i in range(model.get_cardinality(parent))])
                parent_values.append({"name": parent, "values": state_names})
            meta[cpd.variable] = {
                "parents": parents,
                "parent_values": parent_values,
                "state_names": {cpd.variable: cpd.state_names.get(cpd.variable, [str(i) for i in range(cpd.cardinality)])}
            }
            if parents:
                arr = np.array(cpd.values)
                arr = arr.T.tolist()  # Shape: (num_parent_combos, variable_card)
                cpds[cpd.variable] = arr
            else:
                cpds[cpd.variable] = cpd.values.tolist()
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve CPDs: {e}"}), 500

    return jsonify({"cpds": cpds, "meta": meta})

@prereq_bp.route("/update_cpds", methods=["POST"])
def update_cpds():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    model_data = LOADED_MODELS.get(filename)
    if not model_data:
        return jsonify({"error": f"BIF file '{filename}' not found"}), 404

    updated_cpds = request.get_json()
    if not updated_cpds:
        return jsonify({"error": "Missing CPD data in request body"}), 400

    model = model_data["model"]
    try:
        new_cpds = []
        for node, values in updated_cpds.items():
            if node not in model.nodes():
                return jsonify({"error": f"Node '{node}' not in model"}), 400
            parents = model.get_parents(node)
            cardinality = model.get_cardinality(node)
            parent_cardinalities = [model.get_cardinality(p) for p in parents]
            num_parent_combos = np.prod(parent_cardinalities) if parents else 1

            values = np.array(values, dtype=float)
            expected_shape = (num_parent_combos, cardinality) if parents else (cardinality,)
            if values.shape != expected_shape:
                return jsonify({"error": f"Invalid CPD shape for '{node}': expected {expected_shape}, got {values.shape}"}), 400

            if parents:
                for i, row in enumerate(values):
                    if not np.isclose(sum(row), 1.0, atol=1e-6):
                        return jsonify({"error": f"CPD row {i} for '{node}' does not sum to 1: {row.tolist()}"}), 400
                values_t = list(map(list, zip(*values)))  # Transpose to (variable_card, num_parent_combos)
            else:
                if not np.isclose(sum(values), 1.0, atol=1e-6):
                    return jsonify({"error": f"CPD for '{node}' does not sum to 1: {values.tolist()}"}), 400
                values_t = [[v] for v in values]

            cpd = TabularCPD(
                variable=node,
                variable_card=cardinality,
                values=values_t,
                evidence=parents if parents else None,
                evidence_card=parent_cardinalities if parents else None,
                state_names={node: model.get_cpds(node).state_names.get(node, [str(i) for i in range(cardinality)])},
            )
            new_cpds.append(cpd)

        # --- DATABASE UPDATE LOGIC ---
        # 1. Apply changes to the in-memory model
        model.remove_cpds(*model.get_cpds())
        model.add_cpds(*new_cpds)
        model.check_model() # Validate the new model structure

        # --- FIX: Get string content directly from the writer object ---
        writer = BIFWriter(model)
        new_content = str(writer)
        # --- END FIX ---

        # 3. Update the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE bayesian_networks SET content = ? WHERE name = ?",
            (new_content, filename)
        )
        conn.commit()
        conn.close()

        # 4. Reload all models from DB to ensure consistency across the app
        load_bif_files()
        
        return jsonify({"message": "CPDs updated and saved to database successfully"})
        # --- END DATABASE UPDATE LOGIC ---

    except Exception as e:
        # If anything fails, reload the original state from the DB to prevent inconsistency
        load_bif_files()
        return jsonify({"error": f"Failed to update CPDs: {e}"}), 500