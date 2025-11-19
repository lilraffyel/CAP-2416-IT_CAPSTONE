import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { listBifFiles, getCompetencies } from "../api";
import "./TutorQuery.css";
import { API_URL } from '../api.js';

function TutorQuery() {
  // ================= STUDENT SELECTION STATES =================
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentScores, setStudentScores] = useState([]);

  // State for BIF files and selected file
  const [bifFiles, setBifFiles] = useState([]);
  const [selectedBif, setSelectedBif] = useState(null);

  // State for competencies from chosen BIF
  const [competencies, setCompetencies] = useState([]);

  // State for tested items (competency + score)
  const [tested, setTested] = useState([]);
  const [compInput, setCompInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");

  // State for assessment results
  const [manualQueryResults, setManualQueryResults] = useState(null);
  const [isManualQueryLoading, setIsManualQueryLoading] = useState(false); // <-- Loading state for manual query

  // State for student results (like StudentResults.js)
  const [studentResults, setStudentResults] = useState([]);
  const [resultsError, setResultsError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterText, setFilterText] = useState("");
  const [showScoreSortOptions, setShowScoreSortOptions] = useState(false);
  //State for Auto Query Results
  const [autoQueryResults, setAutoQueryResults] = useState([]);
  const [isAutoQueryLoading, setIsAutoQueryLoading] = useState(false); // <-- Loading state for auto query
  const [tutorId, setTutorId] = useState(null);
  
  // New states for the table
  const [contentDomains, setContentDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [competencyTable, setCompetencyTable] = useState([]);
  const [lockedMastery, setLockedMastery] = useState({}); // To lock estimated mastery values
  // Add state for network structure
  const [networkStructure, setNetworkStructure] = useState([]);

  // Load BIF files on mount
  useEffect(() => {
    async function fetchBifList() {
      const data = await listBifFiles();
      setBifFiles(data.bif_files || []);
    }
    fetchBifList();
  }, []);

  // Fetch tutorId on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/me`, { withCredentials: true })
      .then(res => setTutorId(res.data.tutorId))
      .catch(console.error);
  }, []);

  // Fetch students assigned to this tutor
  useEffect(() => {
    if (!tutorId) return;
    axios.get(`${API_URL}/api/teacher/students?tutor_id=${tutorId}`)
      .then(res => setStudents(res.data))
      .catch(console.error);
  }, [tutorId]);

  // Fetch student results when a student is selected
 useEffect(() => {
  if (!selectedStudent) {
    setStudentResults([]);
    return;
  }
  axios
    .get(`${API_URL}/api/teacher/results/${selectedStudent}`, { withCredentials: true })
    .then((res) => {
      setStudentResults(res.data);
      console.log("studentResults", res.data); // <--- Add this line here
    })
    .catch((err) => {
      console.error(err);
      setResultsError("Failed to load results.");
    });
}, [selectedStudent]);

  // Fetch content domains on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/teacher/domains`).then((res) => {
      setContentDomains(res.data);
    });
  }, []);

  // Fetch competencies and saved progress for the selected domain
  useEffect(() => {
    if (!selectedDomain || !selectedStudent) {
        setCompetencyTable([]);
        return;
    };

    const domainInfo = contentDomains.find(d => d.id === parseInt(selectedDomain));
    const domainName = domainInfo?.name;

    const buildTable = (flatStructure) => {
      // First, get the base competency structure
      axios.get(`${API_URL}/api/teacher/competencies?domain=${selectedDomain}`)
        .then((compRes) => {
          const compMap = {};
          compRes.data.forEach(comp => {
            compMap[comp.competency_node] = comp;
          });

          // Then, get the saved progress for this student and domain
          axios.get(`${API_URL}/api/teacher/student-progress?student_id=${selectedStudent}&domain_id=${selectedDomain}`)
            .then(progressRes => {
              const savedProgress = progressRes.data;
              const newLockedMastery = {};

              const tableData = flatStructure.map(item => {
                const savedData = savedProgress[item.node] || {};
                if (savedData.is_locked) {
                    newLockedMastery[item.node] = true;
                }
                return {
                  ...compMap[item.node],
                  node: item.node,
                  indent: item.indent,
                  estimatedMastery: savedData.estimated_mastery || "",
                  rawScore: savedData.raw_score || "",
                  percentage: savedData.percentage || "",
                  actualMastery: savedData.actual_mastery || null,
                };
              }).filter(row => row.node);
              
              setCompetencyTable(tableData);
              setLockedMastery(newLockedMastery);
            });
        });
    };

    if (domainName === 'Estimation') {
      const hardcodedOrder = getEstimationOrder();
      buildTable(hardcodedOrder);
    } else {
      // Dynamically find the BIF file for the selected domain
      axios.get(`${API_URL}/api/teacher/assessments`).then(res => {
        const domainAssessments = res.data[domainName] || [];
        const bifFile = domainAssessments.length > 0 ? domainAssessments[0].bif_file : null;

        if (!bifFile) {
          console.error(`No BIF file found for domain: ${domainName}`);
          setCompetencyTable([]); // Clear table if no BIF is found
          return;
        }

        axios.get(`${API_URL}/api/teacher/network-structure?bif_file=${bifFile}`)
          .then(structureRes => {
            const tree = buildTree(structureRes.data);
            const flat = flattenTree(tree);
            buildTable(flat);
          }).catch(err => {
            console.error(`Error fetching network structure for ${bifFile}:`, err);
            setCompetencyTable([]);
          });
      });
    }
  }, [selectedDomain, selectedStudent, bifFiles, contentDomains]);

  // Update table and SAVE to backend on Auto Query
  useEffect(() => {
    if (!autoQueryResults || !autoQueryResults.competency) return;

    let updatedTable = [];
    let newLocked = { ...lockedMastery };

    setCompetencyTable(prevTable => {
      updatedTable = prevTable.map(row => {
        let updatedMastery = row.estimatedMastery;
        let updatedRawScore = row.rawScore;
        let updatedPercentage = row.percentage;
        let updatedActualMastery = row.actualMastery;

        if (autoQueryResults.mastery_probabilities) {
          const estMastery = autoQueryResults.mastery_probabilities[row.node];
          if (estMastery !== undefined && !lockedMastery[row.node]) {
            updatedMastery = (estMastery * 100).toFixed(2) + "%";
          }
        }

        if (row.node === autoQueryResults.competency) {
          updatedRawScore = autoQueryResults.score;
          updatedPercentage = autoQueryResults.total
            ? ((autoQueryResults.score / autoQueryResults.total) * 100).toFixed(2) + "%"
            : "-";
          updatedActualMastery =
            typeof autoQueryResults.score === "number"
              ? autoQueryResults.score >= 7
                ? "✔ Pass"
                : "✘ Fail"
              : null;
        }

        return {
          ...row,
          estimatedMastery: updatedMastery,
          rawScore: updatedRawScore,
          percentage: updatedPercentage,
          actualMastery: updatedActualMastery,
        };
      });

      // After updating state, save the entire table to the backend
      if (updatedTable.length > 0) {
        if (autoQueryResults.mastery_probabilities) {
            Object.keys(autoQueryResults.mastery_probabilities).forEach(key => {
                newLocked[key] = true;
            });
        }
        axios.post(`${API_URL}/api/teacher/student-progress`, {
            student_id: selectedStudent,
            domain_id: selectedDomain,
            progress: updatedTable.map(row => ({...row, is_locked: newLocked[row.node] || false }))
        });
      }
      return updatedTable;
    });

    if (autoQueryResults.mastery_probabilities) {
      setLockedMastery(newLocked);
    }
  }, [autoQueryResults, selectedStudent, selectedDomain]);

  // ================== STUDENT LOGIC ====================
  const handleToggleStudentDropdown = () => {
    setShowStudentDropdown(!showStudentDropdown);
  };

  const handleSelectStudent = (name) => {
    setSelectedStudent(name);
    setShowStudentDropdown(false);
    setStudentScores([]); // Clear previous scores if needed
  };

  // When a BIF file is selected
  const handleSelectBif = (filename) => {
    setSelectedBif(filename);
    // Clear previous data
    setCompetencies([]);
    setTested([]);
    setManualQueryResults(null);
  };
  
  

  // Load competencies for the selected BIF
  const handleLoadCompetencies = async () => {
    if (!selectedBif) {
      alert("Please select a BIF file first!");
      return;
    }
    try {
      const data = await getCompetencies(selectedBif);
      if (data.error) {
        alert(data.error);
      } else {
        setCompetencies(data.competencies || []);
      }
    } catch (err) {
      console.error("Error loading competencies:", err);
    }
  };

  // When a competency button is clicked, auto-fill the competency field
  const handleSelectCompetency = (comp) => {
    setCompInput(comp);
  };

  // Add the competency and score to the tested list
  const handleAddTested = () => {
    if (!compInput || !scoreInput) return;
    // We only assess one at a time, so we replace the array content
    setTested([{ competency: compInput, score: parseInt(scoreInput) }]);
    setCompInput("");
    setScoreInput("");
  };

  // Assess the tested competencies (and get mastery probabilities if applicable)
  const handleAssess = async () => {
    if (!selectedBif || tested.length === 0) {
      alert("Please select a BIF file and add a tested competency.");
      return;
    }
    const itemToAssess = tested[0];
    setIsManualQueryLoading(true); // <-- Set loading true
    try {
      const res = await axios.post(
        `${API_URL}/api/teacher/manual-query`,
        {
          bif_file: selectedBif,
          competency: itemToAssess.competency,
          score: itemToAssess.score,
          total: 10, // --- FIX: Send a total score of 10 ---
        },
        { withCredentials: true }
      );
      setManualQueryResults(res.data);
    } catch (err) {
      console.error("Error assessing competencies:", err);
      setManualQueryResults({ error: "Failed to fetch manual query result." });
    } finally {
      setIsManualQueryLoading(false); // <-- Set loading false
    }
  };

  // Sorting and filtering for student results
  const handleSort = (key, direction) => {
    if (direction) {
      setSortConfig({ key, direction });
    } else {
      const newDirection = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      setSortConfig({ key, direction: newDirection });
    }
    setShowScoreSortOptions(false);
  };

  // Handler for Auto Query Results
  const handleAutoQuery = async (resultId) => {
    setIsAutoQueryLoading(true); // <-- Set loading true
    try {
      const res = await axios.get(
        // --- FIX: Use the resultId in the URL ---
        `${API_URL}/api/teacher/auto-query-result/${resultId}`,
        { withCredentials: true }
      );
      setAutoQueryResults(res.data);
    } catch (err) {
      setAutoQueryResults({ error: "Failed to fetch automatic query result." });
    } finally {
      setIsAutoQueryLoading(false); // <-- Set loading false
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    let sortableResults = [...studentResults];
    if (filterText) {
      sortableResults = sortableResults.filter(r =>
        r.examName && r.examName.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    sortableResults.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return sortableResults;
  }, [studentResults, sortConfig, filterText]);


  // Format mastery probability as percentage
  function formatPercent(val) {
    if (typeof val !== "number" || isNaN(val)) return "";
    return (val * 100).toFixed(2) + "%";
  }

  // Reset the table and clear backend data
  const handleResetTable = () => {
    if (!selectedStudent || !selectedDomain) return;
    axios.delete(`${API_URL}/api/teacher/student-progress?student_id=${selectedStudent}&domain_id=${selectedDomain}`)
        .then(() => {
            // Reload the page to reflect the changes instantly
            window.location.reload();
        })
        .catch(err => {
            console.error("Failed to reset table:", err);
            // Optionally, alert the user that the reset failed
            alert("Failed to reset the table. Please try again.");
        });
  };

  return (
    <div className="content-box">
      <h2 className="section-title">Tutor Query</h2>

      {/* Student selection at the top */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Select Student:
          <select
            value={selectedStudent || ""}
            onChange={e => setSelectedStudent(e.target.value)}
          >
            <option value="">--Select Student--</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

          {/* ================= STUDENT PROGRESS ================= */}
      <section className="student-progress-section">
        <div className="student-progress-header">
          <div>
            <h3 className="student-progress-title">Student Progress</h3>
            <p className="student-progress-subtitle">
              Track per-competency performance for the selected student and domain.
            </p>
          </div>

          <div className="student-progress-controls">
            <label className="domain-select-label">
              <span>Content Domain</span>
              <select
                className="domain-select"
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
              >
                <option value="">--Select Domain--</option>
                {contentDomains.map(domain => (
                  <option
                    key={domain.id}
                    value={domain.id}
                    disabled={domain.name !== "Estimation"}
                  >
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn btn-secondary btn-reset-table"
              type="button"
              onClick={handleResetTable}
            >
              Reset Table
            </button>
          </div>
        </div>

        <div className="student-progress-card">
          <table className="competency-table">
            <thead>
              <tr>
                <th>Competency / Node</th>
                <th>Estimated Mastery</th>
                <th>Raw Score</th>
                <th>Percentage</th>
                <th>Actual Mastery</th>
              </tr>
            </thead>
            <tbody>
              {competencyTable.map((row, idx) => {
                const status =
                  row.actualMastery &&
                  (row.actualMastery.toLowerCase().includes("pass")
                    ? "pass"
                    : row.actualMastery.toLowerCase().includes("fail")
                    ? "fail"
                    : "neutral");

                return (
                  <tr key={idx} className="competency-row">
                    <td
                      className="competency-name"
                      style={{ paddingLeft: `${row.indent * 1.5}rem` }}
                    >
                      {row.node}
                    </td>

                    <td>
                      <div className="mastery-cell">
                        <div className="mastery-bar">
                          <div
                            className="mastery-bar-fill"
                            style={{
                              width: row.estimatedMastery
                                ? row.estimatedMastery
                                : "0%",
                            }}
                          />
                        </div>
                        <span className="mastery-label">
                          {row.estimatedMastery || "-"}
                        </span>
                      </div>
                    </td>

                    <td className="numeric-cell">
                      {row.rawScore !== "" ? row.rawScore : "-"}
                    </td>

                    <td className="numeric-cell">
                      {row.percentage || "-"}
                    </td>

                    <td>
                      {row.actualMastery ? (
                        <span className={`mastery-badge ${status || "neutral"}`}>
                          {row.actualMastery}
                        </span>
                      ) : (
                        <span className="mastery-badge neutral">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>


      {/* Automatic Query Section */}
      <h3 style={{ marginTop: "2rem" }}>Automatic Query</h3>

      {/* Student Results Table */}
      {selectedStudent && (
  <div className="section" style={{ marginBottom: "2rem" }}>
    <h3 style={{ margin: "0.5rem 0" }}>Results for {students.find(s => s.id === selectedStudent)?.name}</h3>
    <div style={{ marginBottom: "0.5rem", display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button className="btn btn-secondary" onClick={() => handleSort("date")}>Sort by Date</button>
      <button className="btn btn-secondary" onClick={() => setShowScoreSortOptions(!showScoreSortOptions)}>
        Sort by Score
      </button>
      {showScoreSortOptions && (
        <>
          <button className="btn btn-secondary" onClick={() => handleSort('score', 'ascending')}>Ascending</button>
          <button className="btn btn-secondary" onClick={() => handleSort('score', 'descending')}>Descending</button>
        </>
      )}
      <input
        className="form-control"
        style={{ marginLeft: "1rem", width: 200, display: "inline-block" }}
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Filter by Exam Name"
      />
    </div>
    {resultsError && <div style={{ color: "red" }}>{resultsError}</div>}
    <table className="results-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem", background: "#181818" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #444" }}>
          <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
          <th style={{ textAlign: "left", padding: "8px" }}>Exam Name</th>
          <th style={{ textAlign: "left", padding: "8px" }}>Score</th>
          <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredAndSortedResults.map((r) => (
          <tr key={r.result_id || r.id || r.date} style={{ borderBottom: "1px solid #333" }}>
            <td style={{ padding: "8px" }}>{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
            <td style={{ padding: "8px" }}>{r.examName || "-"}</td>
            <td style={{ padding: "8px" }}>{typeof r.score !== "undefined" ? r.score : "-"}</td>
            <td style={{ padding: "8px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleAutoQuery(r.result_id)}
              >
                Auto Query
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    {/* Auto Query Button and Results */}
{selectedStudent && (
  <div className="section" style={{ marginBottom: "2rem" }}>
    {isAutoQueryLoading ? (
      <div>Loading automatic query result...</div>
    ) : autoQueryResults && autoQueryResults.competency ? (
      <div>
        <div>
          <b>Competency:</b> {autoQueryResults.competency}
        </div>
        <div>
          <b>Score:</b> {autoQueryResults.score} / {autoQueryResults.total}
        </div>
        {autoQueryResults.mastery_probabilities && (
          <div>
            <b>Mastery Probabilities:</b>
            <ul style={{ paddingLeft: 16 }}>
              {Object.entries(autoQueryResults.mastery_probabilities).map(([k, v]) => (
                <li key={k}>
                  {k}: <b>{formatPercent(v)}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        {autoQueryResults.next_focus && (
          <div>
            <b>Next Focus:</b> {autoQueryResults.next_focus}
          </div>
        )}
        {autoQueryResults.error && <span style={{ color: "red" }}>Error: {autoQueryResults.error}</span>}
      </div>
    ) : autoQueryResults && autoQueryResults.error ? (
      <div style={{ color: "red" }}>{autoQueryResults.error}</div>
    ) : (
      <div>No automatic query result yet.</div>
    )}
  </div>
)}
<h3 style={{ marginTop: "2rem" }}>Manual Query</h3>
    {/* BIF file selection */}
    <div className="section">
      <h3>BIF Files</h3>
      <ul className="bif-list" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: 0, listStyle: "none" }}>
        {bifFiles.map((file) => (
          <li key={file}>
            <button
              className={`btn btn-secondary${selectedBif === file ? " active" : ""}`}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                backgroundColor: selectedBif === file ? "#007bff" : "#444",
                color: "#fff",
                border: "none"
              }}
              onClick={() => handleSelectBif(file)}
            >
              {file}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="btn btn-success"
        onClick={handleLoadCompetencies}
        disabled={!selectedBif}
        style={{ marginTop: "0.5rem" }}
      >
        Load Competencies
      </button>
    </div>

    {/* Competency selection */}
    {competencies.length > 0 && (
      <div className="section">
        <h3>Competencies</h3>
        <div className="competencies-list" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {competencies.map((comp) => (
            <button
              key={comp}
              className="btn btn-info"
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#17a2b8",
                color: "#fff"
              }}
              onClick={() => handleSelectCompetency(comp)}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>
    )}

  

   {/* Add tested competency and score */}
<div className="section" style={{ marginTop: "1rem" }}>
  <input
    className="form-control"
    type="text"
    placeholder="Competency"
    value={compInput}
    onChange={(e) => setCompInput(e.target.value)}
    style={{ width: 200, marginRight: 8 }}
    disabled={competencies.length === 0} // Disable if no competencies are loaded
  />
  <input
    className="form-control"
    type="number"
    placeholder="Score (out of 10)" // --- FIX: Update placeholder text ---
    value={scoreInput}
    onChange={(e) => setScoreInput(e.target.value)}
    style={{ width: 140, marginRight: 8 }} // Increased width for new placeholder
    min="0"
    max="10" // --- FIX: Set max score to 10 ---
    disabled={competencies.length === 0 || !compInput || tested.length > 0}
  />
  <button
    className="btn btn-primary"
    onClick={handleAddTested}
    // --- FIX: Also disable if an item is already in the 'tested' list ---
    disabled={competencies.length === 0 || !compInput || !scoreInput || tested.length > 0}
  >
    Add
  </button>
</div>

    {/* Tested competencies list */}
    {tested.length > 0 && (
      <div className="section">
        <h4>Tested Competencies</h4>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {tested.map((t, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {t.competency}: {t.score}
              {/* --- FIX: Add a button to clear the tested item and re-enable inputs --- */}
              <button 
                onClick={() => setTested([])} 
                style={{marginLeft: '1em', fontSize: '0.8em', cursor: 'pointer'}}
              >
                Clear
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn-success" onClick={handleAssess}>Assess</button>
      </div>
    )}

    {/* Manual Query Results */}
    {isManualQueryLoading ? (
      <div className="section">
        <h4>Manual Query Result</h4>
        <p>Loading manual query result...</p>
      </div>
    ) : manualQueryResults && (
      <div className="section">
        <h4>Manual Query Result</h4>
        {manualQueryResults.competency ? (
          <div>
            <div>
              <b>Competency:</b> {manualQueryResults.competency}
            </div>
            <div>
              {/* --- FIX: Display the score and total correctly --- */}
              <b>Score:</b> {manualQueryResults.score} / {manualQueryResults.total}
            </div>
            {manualQueryResults.mastery_probabilities && (
              <div>
                <b>Mastery Probabilities:</b>
                <ul style={{ paddingLeft: 16 }}>
                  {Object.entries(manualQueryResults.mastery_probabilities).map(([k, v]) => (
                    <li key={k}>
                      {k}: <b>{formatPercent(v)}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {manualQueryResults.next_focus && (
              <div>
                <b>Next Focus:</b> {manualQueryResults.next_focus}
              </div>
            )}
          </div>
        ) : manualQueryResults.error ? (
          <div style={{ color: "red" }}>{manualQueryResults.error}</div>
        ) : null}
      </div>
    )}
  </div>
);
}

// Hardcoded order and indentation for Estimation domain
function getEstimationOrder() {
  return [
    { node: "Estimation", indent: 0 },
    { node: "Multiply_Two_Numbers", indent: 1 },
    { node: "Product_Using_Multiples", indent: 3 },
    { node: "Sum_Difference_Rounding", indent: 2 },
    { node: "Difference_Up_To_4_Digits", indent: 3 },
    { node: "Sum_Up_To_4_Digits", indent: 3 },
    { node: "Quotient_Using_Multiples", indent: 1 },
    { node: "Divide_2_3_Digit_Numbers", indent: 2 },
  ];
}

// Helper: Map short competency keys to table row labels
function getCompetencyKeyMap() {
  // Map your short keys to the full competency labels
  return {
    "Multiply_Two_Numbers": "Estimate the result of multiplying two numbers where the product is less than 1,000,000",
    "Quotient_Using_Multiples": "Estimate the quotient of 2- to 3-digit numbers divided by 1- to 2-digit numbers, using multiples of 10 or 100 as appropriate",
    "Divide_2_3_Digit_Numbers": "Estimate the quotient when dividing 3- to 4-digit dividends by 1- to 2-digit divisors, by first estimating the dividends and divisors using multiples of 10",
    "Product_Using_Multiples": "Estimate the product of 2- to 3-digit numbers by 1- to 2-digit numbers by estimating the factors using multiples of 10",
    "Sum_Difference_Rounding": "Estimate the sum and difference of two 5- to 6-digit numbers by rounding the addends to the nearest large place value of the numbers",
    "Difference_Up_to_4_Digits": "Estimate the difference of numbers with up to 4 digits",
    "Sum_Up_to_4_Digits": "Estimate the sum of numbers with up to 4 digits"
    // Add other mappings as needed
  };
}

// Helper: Build a tree from flat structure (no repeats, correct hierarchy)
function buildTree(structure) {
  const nodes = {};
  structure.forEach(item => {
    if (!nodes[item.node]) {
      nodes[item.node] = { node: item.node, parents: item.parents, children: [] };
    }
    item.parents.forEach(parent => {
      if (!nodes[parent]) {
        nodes[parent] = { node: parent, parents: [], children: [] };
      }
      nodes[parent].children.push(nodes[item.node]);
    });
  });
  // Roots: nodes with no parents
  return Object.values(nodes).filter(n => n.parents.length === 0);
}

// Helper: Flatten tree with indentation, no repeats
function flattenTree(tree, indent = 0, visited = new Set()) {
  let result = [];
  tree.forEach(node => {
    if (visited.has(node.node)) return; // Prevent repeats
    visited.add(node.node);
    result.push({ node: node.node, indent });
    if (node.children.length > 0) {
      result = result.concat(flattenTree(node.children, indent + 1, visited));
    }
  });
  return result;
}

export default TutorQuery;
