from flask import Blueprint, request, jsonify
from pgmpy.readwrite import BIFReader, BIFWriter
# from pgmpy.inference import BeliefPropagation
from pgmpy.factors.discrete import TabularCPD
import os
import numpy as np
import shutil

prereq_bp = Blueprint('prereq', __name__)

# Use a relative path for portability
BIF_FOLDER = os.path.dirname(os.path.abspath(__file__))

LOADED_MODELS = {}  # { filename: {"model": BayesianModel, "infer": BeliefPropagation}, ... }

def load_bif_files():
    errors = []
    for filename in os.listdir(BIF_FOLDER):
        if filename.endswith(".bif") and not filename.endswith(".backup"):
            try:
                path = os.path.join(BIF_FOLDER, filename)
                bif_reader = BIFReader(path)
                model = bif_reader.get_model()
                # infer = BeliefPropagation(model)
                # LOADED_MODELS[filename] = {"model": model, "infer": infer}
                LOADED_MODELS[filename] = {"model": model}
                print(f"✅ Loaded Bayesian Network: {filename}")
            except Exception as e:
                errors.append(f"Error loading {filename}: {e}")
                print(f"❌ Error loading {filename}: {e}")
    return errors

# Load BIF files and store any errors
BIF_LOAD_ERRORS = load_bif_files()

@prereq_bp.route('/biffiles', methods=['GET'])
def list_bif_files():
    if not LOADED_MODELS and BIF_LOAD_ERRORS:
        return jsonify({"bif_files": [], "error": "No BIF files loaded: " + "; ".join(BIF_LOAD_ERRORS)}), 500
    return jsonify({"bif_files": list(LOADED_MODELS.keys())})

@prereq_bp.route("/competencies", methods=["GET"])
def get_competencies():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    model_data = LOADED_MODELS.get(filename)
    if not model_data:
        print("Available BIFs:", list(LOADED_MODELS.keys()))
        return jsonify({"error": f"BIF file '{filename}' not found"}), 404

    model = model_data["model"]
    nodes = list(model.nodes())
    return jsonify({"competencies": nodes})

@prereq_bp.route("/assess", methods=["POST"])
def assess_competencies():
    filename = request.args.get("bif")
    if not filename:
        return jsonify({"error": "Missing 'bif' query parameter"}), 400

    model_data = LOADED_MODELS.get(filename)
    if not model_data:
        return jsonify({"error": f"BIF file '{filename}' not found"}), 404

    data = request.get_json()
    if not data or "tested" not in data:
        return jsonify({"error": "Missing 'tested' in request body"}), 400

    tested = data.get("tested", [])
    model = model_data["model"]
    # infer = model_data["infer"]

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
                # outcome = determine_next_focus(model, infer, comp)
                outcome = determine_next_focus(model, comp)
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

# def determine_next_focus(model, infer, failed_competency):
def determine_next_focus(model, failed_competency):
    if failed_competency not in model.nodes():
        return {"next_focus": None, "error": f"Competency '{failed_competency}' not in model"}
    prerequisites = model.get_parents(failed_competency)
    if not prerequisites:
        return {"next_focus": None}
    if len(prerequisites) == 1:
        return {"next_focus": prerequisites[0]}

    prob_dict = {}
    for pre in prerequisites:
        try:
            # Get the state names for the failed competency
            state_names = model.get_cpds(failed_competency).state_names.get(failed_competency, None)
            print(f"State names for {failed_competency}:", state_names)
            if state_names:
                # Use the first state as "not mastered"
                not_mastered = state_names[0]
                # Ensure evidence type matches state name type
                state_type = type(not_mastered)
                evidence_value = state_type(not_mastered)
            else:
                # fallback as string
                evidence_value = '0'

            print(f"Inferring {pre} with evidence {failed_competency}={evidence_value} (type: {type(evidence_value)})")
            # result = infer.query(variables=[pre], evidence={failed_competency: evidence_value})
            # prob_dict[pre] = result.values[1]
        except Exception as e:
            print(f"Error inferring for {pre}: {e}")

    if prob_dict:
        weakest = min(prob_dict, key=prob_dict.get)
        return {"next_focus": weakest, "mastery_probabilities": prob_dict}
    return {"next_focus": prerequisites[0]}

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

        path = os.path.join(BIF_FOLDER, filename)
        backup_path = path + ".backup"
        shutil.copy(path, backup_path)  # Create backup

        model.remove_cpds(*model.get_cpds())
        model.add_cpds(*new_cpds)

        writer = BIFWriter(model)
        writer.write_bif(path)

        # Reload model
        try:
            bif_reader = BIFReader(path)
            new_model = bif_reader.get_model()
            # new_infer = BeliefPropagation(new_model)
            LOADED_MODELS[filename] = {"model": new_model}
            os.remove(backup_path)  # Remove backup on success
            return jsonify({"message": "CPDs updated and saved successfully"})
        except Exception as e:
            shutil.copy(backup_path, path)  # Restore backup on failure
            return jsonify({"error": f"Failed to reload model after update: {e}"}), 500

    except Exception as e:
        return jsonify({"error": f"Failed to update CPDs: {e}"}), 500