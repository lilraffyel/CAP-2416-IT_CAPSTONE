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

// Helper: Flatten multi-dimensional CPD values
function flattenValues(values, evidence) {
  if (!Array.isArray(values[0])) return values.map(v => [v]);
  let combos = getParentCombinations(evidence);
  let flat = [];
  combos.forEach(combo => {
    let ref = values;
    combo.forEach(idx => { ref = ref[idx]; });
    flat.push(ref);
  });
  return flat;
}

// Helper: Reshape flat values back to multi-dimensional
function reshapeValues(flat, evidence) {
  if (!evidence || evidence.length === 0) {
    // For singular nodes, pgmpy expects a column vector [[v1], [v2]]
    // but our editor works with a flat array [v1, v2].
    // The conversion to a column vector will be handled on save.
    // Here, we just return the flat array wrapped in another array.
    return flat;
  }
  let shape = Array(evidence.length).fill(2).concat([flat[0].length]);
  let arr = flat.map(row => row);
  // Build nested array
  function nest(arr, dims) {
    if (dims.length === 1) return arr.splice(0, dims[0]);
    let out = [];
    for (let i = 0; i < dims[0]; i++) {
      out.push(nest(arr, dims.slice(1)));
    }
    return out;
  }
  return nest(arr, shape.slice(0, -1));
}

// CPD editor with auto-balance and up/down buttons for flat and nested CPDs
function CPDValueEditor({ values, onChange, evidence }) {
  const isSingular = !evidence || evidence.length === 0;

  // Use existing flatten logic for complex nodes, but handle singular nodes separately.
  const flatRows = isSingular ? [values] : flattenValues(values, evidence);

  // Show parent state combos for clarity, only for complex nodes.
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
      {flatRows.map((row, rowIdx) => (
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
                  if (isSingular) {
                    onChange(newRow); // For singular, the new row is the entire value set
                  } else {
                    let newFlatRows = [...flatRows];
                    newFlatRows[rowIdx] = newRow;
                    onChange(reshapeValues(newFlatRows, evidence));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newRow = autoBalanceRow(row, idx, Math.min(1, v + 0.01));
                  if (isSingular) {
                    onChange(newRow);
                  } else {
                    let newFlatRows = [...flatRows];
                    newFlatRows[rowIdx] = newRow;
                    onChange(reshapeValues(newFlatRows, evidence));
                  }
                }}
              >▲</button>
              <button
                type="button"
                onClick={() => {
                  const newRow = autoBalanceRow(row, idx, Math.max(0, v - 0.01));
                  if (isSingular) {
                    onChange(newRow);
                  } else {
                    let newFlatRows = [...flatRows];
                    newFlatRows[rowIdx] = newRow;
                    onChange(reshapeValues(newFlatRows, evidence));
                  }
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

  useEffect(() => {
    setNetworks([
      "comparing.bif",
      "estimate.bif",
      "money.bif",
      "place-value.bif",
      "ordering.bif",
    ]);
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
    let values = cpd.values;
    const isSingular = !cpd.evidence || cpd.evidence.length === 0;

    // For singular nodes, ensure the value is a flat array like [0.7, 0.3]
    if (isSingular && Array.isArray(values) && values.length > 0 && Array.isArray(values[0])) {
      values = values.flat();
    }
    
    setIsAdding(false); // We are in "edit" mode
    setEditCpd({ variable, ...cpd, values });
  };

  const handleSaveCpd = () => {
    let { variable, values, evidence } = editCpd;
    const isSingular = !evidence || evidence.length === 0;

    // For singular nodes, pgmpy expects a column vector like [[0.7], [0.3]]
    // Convert our flat array [0.7, 0.3] to that format before queueing.
    if (isSingular && Array.isArray(values) && (values.length === 0 || !Array.isArray(values[0]))) {
      values = values.map(v => [v]);
    }

    queueChange("update", {
      network: selectedNetwork,
      variable: variable,
      values: values,
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
    setEditCpd({ variable: "", values: [0.5, 0.5], evidence: [] });
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
            Evidence (comma separated):
            <input
              value={editCpd.evidence.join(",")}
              onChange={e => setEditCpd({ ...editCpd, evidence: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
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