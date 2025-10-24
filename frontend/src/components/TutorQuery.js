import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  listBifFiles,
  getCompetencies,
} from "../api";
import "./TutorQuery.css";

function TutorQuery() {
  // ================= STUDENT SELECTION STATES =================
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  // eslint-disable-next-line no-unused-vars
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
    axios.get('http://localhost:5000/api/me', { withCredentials: true })
      .then(res => setTutorId(res.data.tutorId))
      .catch(console.error);
  }, []);

  // Fetch students assigned to this tutor
  useEffect(() => {
    if (!tutorId) return;
    axios.get(`http://localhost:5000/api/teacher/students?tutor_id=${tutorId}`)
      .then(res => setStudents(res.data)) // keep full objects
      .catch(console.error);
  }, [tutorId]);

  // Fetch student results when a student is selected
 useEffect(() => {
  if (!selectedStudent) {
    setStudentResults([]);
    return;
  }
  axios
    .get(`http://localhost:5000/api/teacher/results/${selectedStudent}`, { withCredentials: true })
    .then((res) => {
      setStudentResults(res.data);
      console.log("studentResults", res.data); // <--- Add this line here
    })
    .catch((err) => {
      console.error(err);
      setResultsError("Failed to load results.");
    });
}, [selectedStudent]);

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
        `http://localhost:5000/api/teacher/manual-query`,
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
        `http://localhost:5000/api/teacher/auto-query-result/${resultId}`,
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

  return (
  <div className="content-box">
    <h2 className="section-title">Tutor Query</h2>
    <h3>Automatic Query</h3>

    {/* Student selection */}
    <div style={{ marginBottom: "1.5rem" }}>
      <button
        className="btn btn-primary"
        style={{ marginBottom: "0.5rem" }}
        onClick={handleToggleStudentDropdown}
      >
        {selectedStudent ? `Student: ${selectedStudent}` : "Select Student"}
      </button>
      {showStudentDropdown && (
        <ul className="dropdown-list" style={{ background: "#222", color: "#fff", listStyle: "none", padding: 0, borderRadius: 4, boxShadow: "0 2px 8px #0008" }}>
          {students.map((s) => (
  <li
    key={s.id}
    className="dropdown-item"
    style={{ cursor: "pointer", padding: "0.5rem", borderBottom: "1px solid #333" }}
    onClick={() => handleSelectStudent(s.id)}
  >
    {s.name}
  </li>
))}
        </ul>
      )}
    </div>

    {/* Student Results Table */}
    {selectedStudent && (
  <div className="section" style={{ marginBottom: "2rem" }}>
    <h3 style={{ margin: "0.5rem 0" }}>Results for {selectedStudent}</h3>
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
          <th style={{ textAlign: "left", padding: "8px" }}>Auto Query</th>
        </tr>
      </thead>
      <tbody>
        {filteredAndSortedResults.map((r, idx) => (
          <tr key={idx} style={{ borderBottom: "1px solid #333" }}>
            <td style={{ padding: "8px" }}>{new Date(r.date).toLocaleDateString()}</td>
            <td style={{ padding: "8px" }}>{r.examName}</td>
            <td style={{ padding: "8px" }}>{r.score}</td>
            <td style={{ padding: "8px" }}>
              {r.result_id && (
                <button
                  className="btn btn-info"
                  // --- FIX: Pass the unique result_id ---
                  onClick={() => handleAutoQuery(r.result_id)}
                >
                  Auto Query
                </button>
              )}
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

export default TutorQuery;