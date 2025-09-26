from flask import Flask, request, jsonify, session
from flask_cors import CORS
from pgmpy.readwrite.BIF import BIFReader, BIFWriter
from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import shutil
import os
from auth_routes import auth_bp
from student_routes import student_bp 
from teacher_routes import teacher_routes
from user_routes import user_routes
from admin_routes import admin_routes


# Import the prerequisite blueprint
from prerequisite.prerequisite_api import prereq_bp

app = Flask(__name__)
app.secret_key = 'your-secret-key'
CORS(app, supports_credentials=True) 

# Reset Bayesian Network Before Loading
def reset_bayesian_network():
    try:
        shutil.copy("original_network.bif", "network.bif")
        print("[INFO] Bayesian Network reset to original state.")
    except Exception as e:
        print(f"[ERROR] Failed to reset Bayesian Network: {e}")

reset_bayesian_network()

#  Load Bayesian Network from BIF file
bif_reader = BIFReader("network.bif")
model = bif_reader.get_model()
inference = VariableElimination(model)  # 🔹 Use Variable Elimination

print("[DEBUG] Loaded Nodes:", model.nodes())
print("[DEBUG] Loaded Edges:", model.edges())

# API to fetch CPDs
@app.route("/api/get_cpds", methods=["GET"])
def get_cpds():
    try:
        bif_reader = BIFReader("network.bif")
        updated_model = bif_reader.get_model()
        cpds = {cpd.variable: {"values": cpd.values.tolist(), "evidence": cpd.variables[1:]} for cpd in updated_model.get_cpds()}
        return jsonify({"cpds": cpds, "message": "CPDs retrieved successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API to fetch sorted mastery probabilities
@app.route("/api/query", methods=["GET"])
def query():
    try:
        sorted_mastery = []
        for skill in model.nodes():
            try:
                result = inference.query(variables=[skill], show_progress=False)
                mastery_prob = result.values.item() if result.values.shape == () else result.values[1]
                sorted_mastery.append({'skill': skill, 'mastery': mastery_prob})
            except Exception as e:
                print(f"[ERROR] Querying {skill} failed: {e}")

        sorted_mastery.sort(key=lambda x: x['mastery'])
        return jsonify({'sorted_mastery': sorted_mastery, 'message': 'Sorted mastery probabilities retrieved successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API to submit assessment scores
@app.route('/api/submit_score', methods=['POST'])
def submit_score():
    if not request.is_json:
        return jsonify({"error": "Invalid Content-Type. Expected application/json"}), 415

    data = request.get_json()
    competency = data.get("competency")
    score = data.get("score")
    total_questions = data.get("totalQuestions")

    if competency is None or score is None or total_questions is None:
        return jsonify({"error": "Missing competency, score, or totalQuestions"}), 400

    update_bayesian_network(competency, score, total_questions)
    return jsonify({"message": "Score submitted successfully"})

# Function to update Bayesian Network using Variable Elimination
def update_bayesian_network(competency, score, total_questions):
    """
    Updates the Bayesian Network while ensuring all dependent nodes update correctly.
    """
    try:
        global bif_reader, model, inference
        bif_reader = BIFReader("network.bif")
        model = bif_reader.get_model()

        # Step 1: Compute Mastery Probability
        mastery_prob = score / total_questions  

        # Step 2: Define and Set State Names Before Updating CPDs
        state_names = {var: [0, 1] for var in model.nodes()}
        for cpd in model.get_cpds():
            cpd.state_names = {cpd.variable: [0, 1], **{parent: [0, 1] for parent in cpd.variables[1:]}}

        # Step 3: Update the Competency CPD
        for cpd in model.get_cpds():
            if cpd.variable == competency:
                evidence = cpd.variables[1:]
                num_parents = len(evidence)

                new_values = [
                    [1 - mastery_prob] * (2 ** num_parents),
                    [mastery_prob] * (2 ** num_parents)
                ]

                updated_cpd = TabularCPD(
                    variable=cpd.variable,
                    variable_card=2,
                    values=new_values,
                    evidence=evidence if num_parents > 0 else None,
                    evidence_card=[2] * num_parents if num_parents > 0 else None,
                    state_names=state_names
                )

                model.add_cpds(updated_cpd)
                print(f"[DEBUG] Updated CPD for {competency}: {new_values} with parents {evidence}")
                break

        #Step 4: Use Variable Elimination for exact inference
        inference = VariableElimination(model)

        #Step 5: Log Inference Results Before Updating CPDs
        print("\n[TEST] Running Variable Elimination inference before CPD updates...\n")

        inferred_probs = {}  # Store inferred probabilities for later evidence use
        for node in model.nodes():
            try:
                # Use previous updates as evidence
                node_evidence = {parent: inferred_probs[parent] for parent in model.get_parents(node) if parent in inferred_probs}
                result = inference.query(variables=[node], evidence=node_evidence, show_progress=False)

                inferred_prob = result.values.item() if result.values.shape == () else result.values[1]
                inferred_probs[node] = inferred_prob  # Store for later updates

                print(f"[TEST] Inferred probability for {node}: {inferred_prob} (Evidence: {node_evidence})")

            except Exception as e:
                print(f"[TEST] Failed to infer {node}: {e}")

        #Step 6: Update Dependent CPDs with New Inference
        for node, inferred_prob in inferred_probs.items():
            try:
                cpd = model.get_cpds(node)
                evidence = cpd.variables[1:]
                num_parents = len(evidence)

                new_values = [
                    [1 - inferred_prob] * (2 ** num_parents),
                    [inferred_prob] * (2 ** num_parents)
                ]

                updated_cpd = TabularCPD(
                    variable=node,
                    variable_card=2,
                    values=new_values,
                    evidence=evidence if num_parents > 0 else None,
                    evidence_card=[2] * num_parents if num_parents > 0 else None,
                    state_names=state_names
                )

                model.add_cpds(updated_cpd)
                print(f"[DEBUG] Updated CPD for {node}: {new_values} with parents {evidence}")

            except Exception as e:
                print(f"[WARNING] Failed to update CPD for {node}: {e}")

        #Step 7: Ensure All CPDs Have Correct State Names
        for cpd in model.get_cpds():
            cpd.state_names = {cpd.variable: [0, 1], **{parent: [0, 1] for parent in cpd.variables[1:]}}

        #Step 8: Validate & Save Model
        model.check_model()
        writer = BIFWriter(model)
        writer.write_bif("network.bif")
        print(f"[DEBUG] BIF file successfully saved.")

        #Step 9: Reload Network with Updated CPDs
        bif_reader = BIFReader("network.bif")
        model = bif_reader.get_model()
        inference = VariableElimination(model)

        print("[DEBUG] Bayesian Network reloaded from updated BIF file.")

    except Exception as e:
        print(f"[ERROR] Failed to update Bayesian Network: {e}")

# Register blueprints
app.register_blueprint(auth_bp) 
app.register_blueprint(student_bp, url_prefix='/api/students')
app.register_blueprint(teacher_routes, url_prefix='/api/teacher')
app.register_blueprint(user_routes, url_prefix='/api/users')
app.register_blueprint(prereq_bp, url_prefix='/api')  # Register the prerequisite blueprint
app.register_blueprint(admin_routes, url_prefix='/api/admin')



#Run the Flask App
if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True, port=5000)