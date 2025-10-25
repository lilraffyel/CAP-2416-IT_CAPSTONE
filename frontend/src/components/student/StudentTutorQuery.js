import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { listBifFiles, getCompetencies } from "../../api";
import "../TutorQuery.css";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "http://localhost:5000";

function StudentTutorQuery() {
  const [studentId, setStudentId] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsError, setResultsError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "descending" });
  const [filterText, setFilterText] = useState("");
  const [showScoreSortOptions, setShowScoreSortOptions] = useState(false);

  const [autoQueryResults, setAutoQueryResults] = useState(null);
  const [isAutoQueryLoading, setIsAutoQueryLoading] = useState(false);

  const [bifFiles, setBifFiles] = useState([]);
  const [selectedBif, setSelectedBif] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [tested, setTested] = useState([]);
  const [compInput, setCompInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [manualQueryResults, setManualQueryResults] = useState(null);
  const [isManualQueryLoading, setIsManualQueryLoading] = useState(false);

  // Load BIF files on mount
  useEffect(() => {
    async function fetchBifFiles() {
      const data = await listBifFiles();
      setBifFiles(data.bif_files || []);
    }
    fetchBifFiles();
  }, []);

  // Determine current student id
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/students/me`, { withCredentials: true })
      .then((res) => setStudentId(res.data.studentId))
      .catch((err) => {
        console.error(err);
        setResultsError("Failed to fetch student information.");
      });
  }, []);

  // Fetch student's assessment results
  useEffect(() => {
    if (!studentId) return;
    axios
      .get(`${API_BASE}/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch((err) => {
        console.error(err);
        setResultsError("Failed to load assessment results.");
      });
  }, [studentId]);

  const handleSort = (key, direction) => {
    if (direction) {
      setSortConfig({ key, direction });
    } else {
      const newDirection = sortConfig.key === key && sortConfig.direction === "ascending" ? "descending" : "ascending";
      setSortConfig({ key, direction: newDirection });
    }
    setShowScoreSortOptions(false);
  };

  const filteredAndSortedResults = useMemo(() => {
    let sortableResults = [...results];
    if (filterText) {
      sortableResults = sortableResults.filter((r) =>
        r.examName && r.examName.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    sortableResults.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

    return sortableResults;
  }, [results, sortConfig, filterText]);

  const handleAutoQuery = async (resultId) => {
    setIsAutoQueryLoading(true);
    setAutoQueryResults(null);
    try {
      const res = await axios.get(`${API_BASE}/api/students/auto-query-result/${resultId}`, {
        withCredentials: true,
      });
      setAutoQueryResults(res.data);
    } catch (err) {
      const errorResponse = err?.response?.data?.error || "Failed to fetch automatic query result.";
      setAutoQueryResults({ error: errorResponse });
    } finally {
      setIsAutoQueryLoading(false);
    }
  };

  const handleSelectBif = (filename) => {
    setSelectedBif(filename);
    setCompetencies([]);
    setTested([]);
    setManualQueryResults(null);
  };

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

  const handleSelectCompetency = (comp) => {
    setCompInput(comp);
  };

  const handleAddTested = () => {
    if (!compInput || !scoreInput) return;
    setTested([{ competency: compInput, score: parseInt(scoreInput, 10) }]);
    setCompInput("");
    setScoreInput("");
  };

  const handleAssess = async () => {
    if (!selectedBif || tested.length === 0) {
      alert("Please select a BIF file and add a tested competency.");
      return;
    }

    const itemToAssess = tested[0];
    setIsManualQueryLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/students/manual-query`,
        {
          bif_file: selectedBif,
          competency: itemToAssess.competency,
          score: itemToAssess.score,
          total: 10,
        },
        { withCredentials: true }
      );
      setManualQueryResults(res.data);
    } catch (err) {
      const errorResponse = err?.response?.data?.error || "Failed to fetch manual query result.";
      setManualQueryResults({ error: errorResponse });
    } finally {
      setIsManualQueryLoading(false);
    }
  };

  const formatPercent = (val) => {
    if (typeof val !== "number" || Number.isNaN(val)) return "";
    return `${(val * 100).toFixed(2)}%`;
  };

  return (
    <div className="content-box">
      <h2 className="section-title">Tutor Query</h2>

      <h3>Automatic Query</h3>
      {resultsError && <div style={{ color: "red", marginBottom: "1rem" }}>{resultsError}</div>}

      {filteredAndSortedResults.length > 0 ? (
        <div className="section" style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => handleSort("date")}>
              Sort by Date
            </button>
            <button className="btn btn-secondary" onClick={() => setShowScoreSortOptions(!showScoreSortOptions)}>
              Sort by Score
            </button>
            {showScoreSortOptions && (
              <>
                <button className="btn btn-secondary" onClick={() => handleSort("score", "ascending")}>
                  Ascending
                </button>
                <button className="btn btn-secondary" onClick={() => handleSort("score", "descending")}>
                  Descending
                </button>
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
                      <button className="btn btn-info" onClick={() => handleAutoQuery(r.result_id)}>
                        Auto Query
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No completed assessments yet.</p>
      )}

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
          </div>
        ) : autoQueryResults && autoQueryResults.error ? (
          <div style={{ color: "red" }}>{autoQueryResults.error}</div>
        ) : (
          <div>No automatic query result yet.</div>
        )}
      </div>

      <h3 style={{ marginTop: "2rem" }}>Manual Query</h3>
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
                  border: "none",
                }}
                onClick={() => handleSelectBif(file)}
              >
                {file}
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn-success" onClick={handleLoadCompetencies} disabled={!selectedBif} style={{ marginTop: "0.5rem" }}>
          Load Competencies
        </button>
      </div>

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
                  color: "#fff",
                }}
                onClick={() => handleSelectCompetency(comp)}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section" style={{ marginTop: "1rem" }}>
        <input
          className="form-control"
          type="text"
          placeholder="Competency"
          value={compInput}
          onChange={(e) => setCompInput(e.target.value)}
          style={{ width: 200, marginRight: 8 }}
          disabled={competencies.length === 0}
        />
        <input
          className="form-control"
          type="number"
          placeholder="Score (out of 10)"
          value={scoreInput}
          onChange={(e) => setScoreInput(e.target.value)}
          style={{ width: 140, marginRight: 8 }}
          min="0"
          max="10"
          disabled={competencies.length === 0 || !compInput || tested.length > 0}
        />
        <button
          className="btn btn-primary"
          onClick={handleAddTested}
          disabled={competencies.length === 0 || !compInput || !scoreInput || tested.length > 0}
        >
          Add
        </button>
      </div>

      {tested.length > 0 && (
        <div className="section">
          <h4>Tested Competencies</h4>
          <ul style={{ padding: 0, listStyle: "none" }}>
            {tested.map((t, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                {t.competency}: {t.score}
                <button onClick={() => setTested([])} style={{ marginLeft: "1em", fontSize: "0.8em", cursor: "pointer" }}>
                  Clear
                </button>
              </li>
            ))}
          </ul>
          <button className="btn btn-success" onClick={handleAssess}>
            Assess
          </button>
        </div>
      )}

      {isManualQueryLoading ? (
        <div className="section">
          <h4>Manual Query Result</h4>
          <p>Loading manual query result...</p>
        </div>
      ) : (
        manualQueryResults && (
          <div className="section">
            <h4>Manual Query Result</h4>
            {manualQueryResults.competency ? (
              <div>
                <div>
                  <b>Competency:</b> {manualQueryResults.competency}
                </div>
                <div>
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
        )
      )}
    </div>
  );
}

export default StudentTutorQuery;

