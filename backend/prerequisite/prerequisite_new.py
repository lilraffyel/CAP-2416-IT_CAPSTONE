import time
from pgmpy.readwrite import BIFReader
from pgmpy.inference import BeliefPropagation
from tabulate import tabulate
import numpy as np

BIF_FILES = {
    "1": "comparing.bif",
    "2": "estimate.bif",
    "3": "money.bif",
    "4": "place-value.bif",
    "5": "ordering.bif"
}

def load_bif(file_name):
    """Loads a BIF file and initializes the model and inference engine."""
    try:
        bif_reader = BIFReader(file_name)
        model = bif_reader.get_model()
        infer = BeliefPropagation(model)
        print(f"\n✅ Successfully loaded {file_name}")
        return model, infer
    except Exception as e:
        print(f"\n❌ Error loading {file_name}: {e}")
        return None, None

def select_bif():
    """Allows the user to select which BIF file to use."""
    print("\n--- Select a BIF File ---")
    for key, file_name in BIF_FILES.items():
        print(f"{key}. {file_name}")

    choice = input("\nEnter the number of the BIF file to use: ").strip()
    
    if choice in BIF_FILES:
        return BIF_FILES[choice]
    else:
        print("Invalid selection. Exiting...")
        exit()

# Select and load BIF file
bif_file = select_bif()
model, infer = load_bif(bif_file)
if not model or not infer:
    exit()

# print(f" Model contains {len(model.nodes())} nodes and {len(model.edges())} edges.")
# print(f" Nodes: {model.nodes()}")
# print(f" Edges: {model.edges()}")

competencies = list(model.nodes())

def get_prerequisites(competency):
    """Returns the direct prerequisites (parent nodes) of a given competency."""
    return model.get_parents(competency)

def get_dependent_competencies(competency):
    """Returns the direct children of a given competency."""
    return model.get_children(competency)

def is_leaf_node(competency):
    """Checks if a competency is a leaf node (no children)."""
    return len(get_dependent_competencies(competency)) == 0

def get_foundational_nodes():
    """Identifies foundational nodes dynamically (nodes with no parents but with children)."""
    return [node for node in competencies if not get_prerequisites(node) and get_dependent_competencies(node)]

FOUNDATIONAL_NODES = get_foundational_nodes()
print(f"\n📌 Foundational nodes detected: {FOUNDATIONAL_NODES}")

def determine_next_focus(failed_competency):
    """Determines the best competency to focus on after failure."""
    
    # If it's a foundational node, suggest an alternative higher-level node
    if failed_competency in FOUNDATIONAL_NODES:
        print(f"\n⚠️ {failed_competency} is a foundational concept. Consider reviewing it again before moving forward.")
        return None 
      
    
    # Default behavior for non-foundational nodes (use direct prerequisites)
    prerequisites = get_prerequisites(failed_competency)
    
    if not prerequisites:
        print(f"No prerequisite found for {failed_competency}.")
        return None  

    if len(prerequisites) == 1:
        print(f"Since {failed_competency} has only one prerequisite, focus on {prerequisites[0]}.")
        return prerequisites[0]

    print(f"\n{failed_competency} has multiple prerequisites: {prerequisites}. Using BN inference to decide.")

    prob_dict = {}

    for prerequisite in prerequisites:
        if prerequisite not in model.nodes():
            print(f"⚠️ Warning: {prerequisite} is not found in the Bayesian Network. Skipping.")
            continue  # Skip nodes that are not in the BN

        try:
            query_result = infer.query([prerequisite], evidence={failed_competency: "0"})
            print(f"\nDEBUG: Type of query_result.values for {prerequisite}: {type(query_result.values)}")
            print(f"DEBUG: Probability values for {prerequisite}: {query_result.values}")

             
            if isinstance(query_result.values, (list, tuple)):
                    prob_dict[prerequisite] = query_result.values[1]  
            elif hasattr(query_result, "values") and isinstance(query_result.values, np.ndarray):
                    prob_dict[prerequisite] = query_result.values[1]
            else:
                print(f"⚠️ Unexpected format for {prerequisite}, using default handling.")
                prob_dict[prerequisite] = query_result.values[0]
        except Exception as e:
                print(f"⚠️ Warning: Could not infer probability for {prerequisite}. Error: {e}")
    if prob_dict:
        print("\nMastery probabilities of prerequisites:")
        table_data = [[prereq, f"{prob:.2%}"] for prereq, prob in prob_dict.items()]
        print(tabulate(table_data, headers=["Prerequisite", "Mastery Probability"], tablefmt="grid"))

        weakest_prerequisite = min(prob_dict, key=prob_dict.get)
        print(f"\nWeakest prerequisite: {weakest_prerequisite} ({prob_dict[weakest_prerequisite]:.2%} mastery).")
        return weakest_prerequisite

    return prerequisites[0]


def assess_competencies():
    """Handles competency assessment and provides recommendations."""
    print("\n--- Available Competencies ---")
    for i, comp in enumerate(competencies):
        print(f"{i + 1}. {comp}")

    try:
        selected_competencies = input("\nEnter the numbers of the competencies tested (comma-separated, e.g., 1,3,5): ")
        selected_indices = [int(x.strip()) - 1 for x in selected_competencies.split(",")]

        if any(idx < 0 or idx >= len(competencies) for idx in selected_indices):
            print("Invalid selection. Exiting...")
            return

        scores = {}
        for idx in selected_indices:
            competency = competencies[idx]
            score = int(input(f"Enter the student's score for {competency} (0 to 10): "))
            if 0 <= score <= 10:
                scores[competency] = score
            else:
                print("Invalid score. Must be between 0 and 10. Exiting...")
                return

        failed_competencies = [comp for comp, score in scores.items() if score < 7]

        # Process failed competencies
        for competency in failed_competencies:
            print(f"\n❌ Student struggled with {competency}. Determining next focus area...")
            next_focus = determine_next_focus(competency)
            if next_focus:
                print(f"\n🔻 Recommended next competency: {next_focus}\n")
            else:
                print(f"No clear prerequisite for {competency}. Consider reviewing general concepts.")

    except ValueError:
        print("Invalid input. Exiting...")

if __name__ == '__main__':
    print("\n--- BN Tutoring System Prototype ---")
    assess_competencies()
