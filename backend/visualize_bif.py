import networkx as nx
import matplotlib.pyplot as plt
from pgmpy.readwrite import BIFReader

def visualize_bif(bif_file):
    # Load the BIF file
    reader = BIFReader(bif_file)
    model = reader.get_model()
    
    # Create a directed graph
    G = nx.DiGraph()
    
    # Add edges from the model
    for edge in model.edges():
        G.add_edge(edge[0], edge[1])

    # Draw the Bayesian Network
    plt.figure(figsize=(12, 6))
    pos = nx.spring_layout(G, seed=42)  # Layout for positioning nodes
    nx.draw(G, pos, with_labels=True, node_color="lightblue", edge_color="black", node_size=3000, font_size=10, font_weight="bold")
    
    plt.title("Graphical Representation of Bayesian Network")
    plt.show()

# Example usage
bif_filename = "original_network.bif"  # Change this to the actual file path
visualize_bif(bif_filename)
