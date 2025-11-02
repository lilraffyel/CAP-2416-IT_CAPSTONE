import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "http://localhost:5000";

function renderValues(values) {
  if (!Array.isArray(values)) return "";
  // Flat CPD: [0.7, 0.3]
  if (values.length && !Array.isArray(values[0])) {
    return values.join(", ");
  }
  // Nested CPD: [[0.8, 0.2], [0.4, 0.6]]
  // Show each row as a group: "0.8, 0.2 | 0.4, 0.6"
  return values.map(row => Array.isArray(row) ? row.join(", ") : row).join(" | ");
}

function renderStructure(cpds) {
  return (
    <table border="1" style={{ marginBottom: "1em" }}>
      <thead>
        <tr>
          <th>Node</th>
          <th>Parents (Evidence)</th>
        </tr>
      </thead>
      <tbody>
        {cpds.map(([variable, cpd]) => (
          <tr key={variable}>
            <td>{variable}</td>
            <td>{cpd.evidence.length > 0 ? cpd.evidence.join(", ") : <i>None</i>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Helper: Generate all parent state combinations
function getParentCombinations(evidence, evidenceCard = 2) {
  if (!evidence || evidence.length === 0) return [[]];
  const combos = [];
  const recurse = (prefix, idx) => {
    if (idx === evidence.length) {
      combos.push(prefix);
      return;
    }
    for (let i = 0; i < evidenceCard; i++) {
      recurse([...prefix, i], idx + 1);
    }
  };
  recurse([], 0);
  return combos;
}

// --- REMOVE 'flattenValues' and 'reshapeValues' ---
// These functions are the source of the bug and will be removed.

// --- NEW: Component for dynamically editing evidence with dropdowns ---
function EvidenceEditor({ evidence, allNodes, variable, onChange }) {
  const availableNodes = allNodes.filter(n => n !== variable && !evidence.includes(n));

  const handleEvidenceChange = (index, newValue) => {
    const newEvidence = [...evidence];
    newEvidence[index] = newValue;
    onChange(newEvidence.filter(Boolean)); // Filter out any empty selections
  };

  const addEvidence = () => {
    onChange([...evidence, ""]); // Add a placeholder for a new dropdown
  };

  const removeEvidence = (index) => {
    const newEvidence = evidence.filter((_, i) => i !== index);
    onChange(newEvidence);
  };

  return (
    <div>
      {evidence.map((ev, index) => (
        <div key={index} style={{ marginBottom: '5px' }}>
          <select
            value={ev}
            onChange={(e) => handleEvidenceChange(index, e.target.value)}
          >
            <option value="">-- Select Evidence --</option>
            {/* Add the currently selected node back to the list of options for this dropdown */}
            {ev && <option value={ev}>{ev}</option>}
            {availableNodes.map(node => (
              <option key={node} value={node}>{node}</option>
            ))}
          </select>
          <button type="button" onClick={() => removeEvidence(index)} style={{ marginLeft: '10px' }}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addEvidence}>
        Add Evidence
      </button>
    </div>
  );
}

// CPD editor with auto-balance and up/down buttons
function CPDValueEditor({ values, onChange, evidence }) {
  const isSingular = !evidence || evidence.length === 0;

  // The 'values' state is now always a simple list of rows.
  // For a singular node, it's a single row inside a list: [[0.5, 0.5]]
  const rows = values || [];

  const combos = isSingular ? [] : getParentCombinations(evidence);

  function autoBalanceRow(row, idx, newValue) {
  const n = row.length;
  let newRow = [...row];

  // Clamp and round the new value
  newRow[idx] = Math.max(0.01, Math.min(0.99, parseFloat(newValue.toFixed(2))));

  if (n === 2) {
    // Binary case: directly calculate the other value
    newRow[1 - idx] = parseFloat((1 - newRow[idx]).toFixed(2));
    // Clamp the other value to ensure it stays valid
    newRow[1 - idx] = Math.max(0.01, Math.min(0.99, newRow[1 - idx]));
  } else {
    // Proportionally adjust other values for multi-state rows
    const totalOther = newRow.reduce((sum, v, i) => i !== idx ? sum + v : sum, 0);
    const remaining = parseFloat((1 - newRow[idx]).toFixed(2));
    for (let i = 0; i < n; i++) {
      if (i !== idx) {
        newRow[i] = Math.max(0.01, Math.min(0.99, parseFloat((remaining * (row[i] / totalOther || 1 / (n - 1))).toFixed(2))));
      }
    }
  }

  // Ensure the sum is exactly 1 by adjusting the last value
  const sum = newRow.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-6) {
    const fixIdx = newRow.findIndex((v, i) => i !== idx && v > 0);
    if (fixIdx !== -1) newRow[fixIdx] += parseFloat((1 - sum).toFixed(2));
  }

  return newRow.map(v => Math.max(0.01, Math.min(0.99, parseFloat(v.toFixed(2)))));
}

  return (
    <div>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} style={{ marginBottom: "0.5em" }}>
          <span>
            {isSingular
              ? "Row 1:"
              : `Parent: (${combos[rowIdx].join(", ")}) Row ${rowIdx + 1}:`}
          </span>
          {row.map((v, idx) => (
            <span key={idx} style={{ marginRight: "0.5em" }}>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={v}
                onChange={e => {
                  const newRow = autoBalanceRow(row, idx, parseFloat(e.target.value) || 0);
                  const newRows = [...rows];
                  newRows[rowIdx] = newRow;
                  onChange(newRows);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newRow = autoBalanceRow(row, idx, Math.min(1, v + 0.01));
                  const newRows = [...rows];
                  newRows[rowIdx] = newRow;
                  onChange(newRows);
                }}
              >▲</button>
              <button
                type="button"
                onClick={() => {
                  const newRow = autoBalanceRow(row, idx, Math.max(0, v - 0.01));
                  const newRows = [...rows];
                  newRows[rowIdx] = newRow;
                  onChange(newRows);
                }}
              >▼</button>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function BayesianNetworkManagement() {
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [cpds, setCpds] = useState([]);
  const [editCpd, setEditCpd] = useState(null);
  const [isAdding, setIsAdding] = useState(false); // Track add vs. edit mode
  const [message, setMessage] = useState("");
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state

  // --- NEW: Derive all node names from the CPDs list ---
  const allNodes = cpds.map(([variable, _]) => variable);

  useEffect(() => {
    // --- FIX: Fetch BIF files from the backend instead of hardcoding ---
    axios.get(`${API_BASE}/api/biffiles`, { withCredentials: true })
      .then(res => {
        setNetworks(res.data.bif_files || []);
      })
      .catch(err => {
        console.error("Failed to fetch BIF files:", err);
        setNetworks([]); // Set to empty array on error
      });
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      setIsLoading(true); // <-- Set loading to true before the request
      axios
        .get(`${API_BASE}/api/admin/get_cpds?network=${selectedNetwork}`, { withCredentials: true })
        .then((res) => {
          const data = res.data;
          if (data.cpds) {
            setCpds(Object.entries(data.cpds));
          } else {
            setCpds([]);
            setMessage(data.error || "No CPDs found.");
          }
        })
        .catch((err) => {
          setCpds([]);
          setMessage("Error loading CPDs.");
          console.error("Fetch error:", err);
        })
        .finally(() => {
          setIsLoading(false); // <-- Set loading to false after the request completes
        });
    }
  }, [selectedNetwork]);

  const handleNetworkSelect = (e) => {
    setSelectedNetwork(e.target.value);
    setMessage("");
    setEditCpd(null);
    setIsAdding(false); // Reset mode on network change
    setPendingChanges([]);
  };

  const queueChange = (type, payload) => {
    setPendingChanges((prev) => [...prev, { type, ...payload }]);
  };

 const handleEditClick = (variable, cpd) => {
    // --- START: Definitive Fix ---
    // The 'cpd.values' from the backend for a complex node is already a list of rows.
    // For a singular node, it's a flat array. We need to wrap it in a list of rows.
    const isSingular = !cpd.evidence || cpd.evidence.length === 0;
    const valuesForEditor = isSingular ? [cpd.values] : cpd.values;
    // --- END: Definitive Fix ---
    
    setIsAdding(false); // We are in "edit" mode
    setEditCpd({ variable, ...cpd, values: valuesForEditor });
  };

  const handleSaveCpd = () => {
    let { variable, values, evidence } = editCpd;

    // --- START FINAL FIX ---
    // REMOVE the logic that converts a singular node's values to a 2D column vector.
    // The frontend will now consistently send a flat array for singular nodes,
    // and a nested array for complex nodes. The backend will handle all formatting.
    // --- END FINAL FIX ---

    queueChange("update", {
      network: selectedNetwork,
      variable: variable,
      values: values, // Send the 'values' as-is
      evidence: evidence,
    });
    setEditCpd(null);
    setIsAdding(false); // Reset mode
    setMessage("Change queued. Click 'Save Changes & Reload BIFs' to apply.");
  };

  const handleDeleteCpd = (variable) => {
    queueChange("delete", {
      network: selectedNetwork,
      variable,
    });
    setMessage("Delete queued. Click 'Save Changes & Reload BIFs' to apply.");
  };

  const handleAddCpd = () => {
    setIsAdding(true); // We are in "add" mode
    // --- START: Definitive Fix ---
    // Initialize 'values' as a list containing one row.
    // This ensures the data structure is consistent from the start.
    setEditCpd({ variable: "", values: [[0.5, 0.5]], evidence: [] });
    // --- END: Definitive Fix ---
  };

  const handleRemoveQueuedChange = (indexToRemove) => {
    setPendingChanges(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveAll = () => {
    axios
      .post(
        `${API_BASE}/api/admin/batch_update_cpds`,
        { changes: pendingChanges },
        { withCredentials: true }
      )
      .then((res) => {
        setMessage(res.data.message || "All changes saved and BIFs reloaded.");
        setPendingChanges([]);
        axios
          .get(`${API_BASE}/api/admin/get_cpds?network=${selectedNetwork}`, { withCredentials: true })
          .then((res) => setCpds(Object.entries(res.data.cpds)));
      })
      .catch((err) => {
        setMessage("Error saving changes.");
        console.error(err);
      });
  };

  return (
    <div>
      <h2>Bayesian Network Management</h2>
      <label>
        Select Network:
        <select value={selectedNetwork} onChange={handleNetworkSelect}>
          <option value="">--Select--</option>
          {networks.map((net) => (
            <option key={net} value={net}>{net}</option>
          ))}
        </select>
      </label>

      {selectedNetwork && (
        <>
          <h3>Network Structure</h3>
          {isLoading ? <p>Loading network structure...</p> : renderStructure(cpds)}

          <h3>Conditional Probability Tables (CPDs)</h3>
          <button onClick={handleAddCpd}>Add New CPD</button>
          {pendingChanges.length > 0 && (
            <button style={{ marginLeft: "1em" }} onClick={handleSaveAll}>
              Save Changes & Reload BIFs
            </button>
          )}

          {/* START: Display Pending Changes in a Table */}
          {pendingChanges.length > 0 && (
            <div style={{ margin: "1em 0" }}>
              <h4>Pending Changes</h4>
              <table border="1">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Variable</th>
                    <th>Network</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingChanges.map((change, index) => (
                    <tr key={index}>
                      <td>
                        <span
                          style={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            padding: '3px 8px',
                            borderRadius: '4px',
                            color: 'white',
                            backgroundColor: change.type === 'delete' ? '#d9534f' : '#5bc0de',
                          }}
                        >
                          {change.type}
                        </span>
                      </td>
                      <td>{change.variable}</td>
                      <td><em>{change.network}</em></td>
                      <td>
                        <button onClick={() => handleRemoveQueuedChange(index)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* END: Display Pending Changes */}

          <table border="1">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Evidence</th>
                <th>Values</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>Loading CPDs...</td>
                </tr>
              ) : cpds.length === 0 ? (
                <tr>
                  <td colSpan={4}>No CPDs found.</td>
                </tr>
              ) : (
                cpds.map(([variable, cpd]) => (
                  <tr key={variable}>
                    <td>{variable}</td>
                    <td>{cpd.evidence.join(", ")}</td>
                    <td>{renderValues(cpd.values)}</td>
                    <td>
                      <button onClick={() => handleEditClick(variable, cpd)}>Edit</button>
                      <button onClick={() => handleDeleteCpd(variable)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {editCpd && (
        <div style={{ border: "1px solid #ccc", padding: "1em", margin: "1em 0" }}>
          <h4>{isAdding ? "Add CPD" : "Edit CPD"}</h4>
          <label>
            Variable:
            <input
              value={editCpd.variable}
              onChange={e => setEditCpd({ ...editCpd, variable: e.target.value })}
              disabled={!isAdding}
            />
          </label>
          <br />
          <label>
            Evidence:
            {/* --- REPLACE: Use the new EvidenceEditor component --- */}
            <EvidenceEditor
              evidence={editCpd.evidence}
              allNodes={allNodes}
              variable={editCpd.variable}
              onChange={newEvidence => {
                const combos = getParentCombinations(newEvidence);
                // Always create a simple list of rows
                const newValues = combos.length > 1 
                  ? Array(combos.length).fill([0.5, 0.5])
                  : [[0.5, 0.5]]; // Singular nodes also use a list of rows
                setEditCpd({ ...editCpd, evidence: newEvidence, values: newValues });
              }}
            />
          </label>
          <br />
          <label>
            Values:
            <CPDValueEditor
              values={editCpd.values}
              onChange={vals => setEditCpd({ ...editCpd, values: vals })}
              evidence={editCpd.evidence}
            />
          </label>
          <br />
          <button onClick={handleSaveCpd}>Queue Change</button>
          <button onClick={() => { setEditCpd(null); setIsAdding(false); }}>Cancel</button>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default BayesianNetworkManagement;