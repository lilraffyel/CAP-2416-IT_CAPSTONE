from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD
from pgmpy.readwrite import BIFWriter

# ✅ Updated Bayesian Network Structure (Using Underscores for Variable Names)
model = BayesianNetwork([
    ('Ordering_Numbers', 'Numbers_N'),
    ('Ordering_Numbers', 'Compare_Order_Decimals'),
    ('Ordering_Numbers', 'Order_Numbers_10k'),
    ('Ordering_Numbers', 'Order_Numbers_1k'),
    ('Ordering_Numbers', 'Order_Numbers_100'),
    ('Ordering_Numbers', 'Order_Numbers_20'),
    ('Compare_Order_Decimals', 'Numbers_N'),
    ('Order_Numbers_10k', 'Compare_Order_Decimals'),
    ('Order_Numbers_1k', 'Order_Numbers_10k'),
    ('Order_Numbers_100', 'Order_Numbers_1k'),
    ('Order_Numbers_20', 'Order_Numbers_100')
])

# ✅ Define CPDs with 50-50 initial probabilities
cpd_ordering_numbers = TabularCPD(
    variable='Ordering_Numbers', variable_card=2,
    values=[[0.5], [0.5]]
)

cpd_numbers = TabularCPD(
    variable='Numbers_N', variable_card=2,
    evidence=['Ordering_Numbers', 'Compare_Order_Decimals'],
    evidence_card=[2, 2],
    values=[[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
)

cpd_compare_order_decimals = TabularCPD(
    variable='Compare_Order_Decimals', variable_card=2,
    evidence=['Ordering_Numbers', 'Order_Numbers_10k'],
    evidence_card=[2, 2],
    values=[[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
)

cpd_order_10k = TabularCPD(
    variable='Order_Numbers_10k', variable_card=2,
    evidence=['Ordering_Numbers', 'Order_Numbers_1k'],
    evidence_card=[2, 2],
    values=[[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
)

cpd_order_1k = TabularCPD(
    variable='Order_Numbers_1k', variable_card=2,
    evidence=['Ordering_Numbers', 'Order_Numbers_100'],
    evidence_card=[2, 2],
    values=[[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
)

cpd_order_100 = TabularCPD(
    variable='Order_Numbers_100', variable_card=2,
    evidence=['Ordering_Numbers', 'Order_Numbers_20'],
    evidence_card=[2, 2],
    values=[[0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]]
)

cpd_order_20 = TabularCPD(
    variable='Order_Numbers_20', variable_card=2,
    evidence=['Ordering_Numbers'],
    evidence_card=[2],
    values=[[0.5, 0.5], [0.5, 0.5]]
)

# ✅ Attach CPDs to Model
model.add_cpds(
    cpd_ordering_numbers, cpd_numbers, cpd_compare_order_decimals,
    cpd_order_10k, cpd_order_1k, cpd_order_100, cpd_order_20
)

# ✅ Save the Bayesian Network as a properly formatted BIF file
bif_writer = BIFWriter(model)
bif_writer.network_name = "BN_Tutoring_System"  # ✅ Set a network name
bif_writer.write_bif("network.bif")

print("✅ BIF file 'network.bif' successfully created with proper formatting!")
