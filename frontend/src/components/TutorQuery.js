import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  listBifFiles,
  getCompetencies,
  assessCompetencies
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
  const [assessmentResults, setAssessmentResults] = useState([]);

  // State for student results (like StudentResults.js)
  const [studentResults, setStudentResults] = useState([]);
  const [resultsError, setResultsError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [sortField, setSortField] = useState("");
  const [filterText, setFilterText] = useState("");

  // Load BIF files on mount
  useEffect(() => {
    async function fetchBifList() {
      const data = await listBifFiles();
      setBifFiles(data.bif_files || []);
    }
    fetchBifList();
  }, []);

  // Fetch students (mock or real)
  useEffect(() => {
    // Replace with real fetch if available
    setStudents(["student1", "student2", "student3"]);
  }, []);

  // Fetch student results when a student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setStudentResults([]);
      return;
    }
    axios
      .get(`http://localhost:5000/api/students/results/${selectedStudent}`, { withCredentials: true })
      .then((res) => setStudentResults(res.data))
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
    setAssessmentResults([]);
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
    setTested([...tested, { competency: compInput, score: parseInt(scoreInput) }]);
    setCompInput("");
    setScoreInput("");
  };

  // Assess the tested competencies (and get mastery probabilities if applicable)
  const handleAssess = async () => {
    if (!selectedBif) {
      alert("Please select a BIF file first!");
      return;
    }
    try {
      const data = await assessCompetencies(selectedBif, tested);
      if (data.assessment_results) {
        setAssessmentResults(data.assessment_results);
      }
    } catch (err) {
      console.error("Error assessing competencies:", err);
    }
  };

  // Sorting and filtering for student results
  const handleSort = (field) => {
    setSortField(field);
    const sorted = [...studentResults].sort((a, b) => {
      if (field === "date") {
        return new Date(a.date) - new Date(b.date);
      } else if (field === "score") {
        return a.score - b.score;
      }
      return 0;
    });
    setStudentResults(sorted);
  };

  const filteredResults = studentResults.filter((r) => {
    if (!filterText) return true;
    return r.examName && r.examName.toLowerCase().includes(filterText.toLowerCase());
  });

  // Format mastery probability as percentage
  function formatPercent(val) {
    if (typeof val !== "number" || isNaN(val)) return "";
    return (val * 100).toFixed(2) + "%";
  }

  return (
  <div className="content-box">
    <h2 className="section-title">Tutor Query</h2>

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
              key={s}
              className="dropdown-item"
              style={{ cursor: "pointer", padding: "0.5rem", borderBottom: "1px solid #333" }}
              onClick={() => handleSelectStudent(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>

    {/* Student Results Table */}
    {selectedStudent && (
      <div className="section" style={{ marginBottom: "2rem" }}>
        <h3 style={{ margin: "0.5rem 0" }}>Results for {selectedStudent}</h3>
        <div style={{ marginBottom: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => handleSort("date")}>Sort by Date</button>
          <button className="btn btn-secondary" onClick={() => handleSort("score")} style={{ marginLeft: "0.5rem" }}>
            Sort by Score
          </button>
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
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "8px" }}>{new Date(r.date).toLocaleDateString()}</td>
                <td style={{ padding: "8px" }}>{r.examName}</td>
                <td style={{ padding: "8px" }}>{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

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
      />
      <input
        className="form-control"
        type="number"
        placeholder="Score"
        value={scoreInput}
        onChange={(e) => setScoreInput(e.target.value)}
        style={{ width: 80, marginRight: 8 }}
      />
      <button className="btn btn-primary" onClick={handleAddTested}>Add</button>
    </div>

    {/* Tested competencies list */}
    {tested.length > 0 && (
      <div className="section">
        <h4>Tested Competencies</h4>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {tested.map((t, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {t.competency}: {t.score}
            </li>
          ))}
        </ul>
        <button className="btn btn-success" onClick={handleAssess}>Assess</button>
      </div>
    )}

    {/* Assessment results as percentages */}
    {assessmentResults.length > 0 && (
      <div className="section">
        <h4>Assessment Results</h4>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {assessmentResults.map((res, idx) => (
            <li key={idx} style={{ marginBottom: 12 }}>
              {res.competency}: Score {res.score}{" "}
              {res.next_focus && (
                <span>
                  | Next Focus: <b>{res.next_focus}</b>
                </span>
              )}
              {res.mastery_probabilities && (
                <div>
                  Mastery Probabilities:
                  <ul style={{ paddingLeft: 16 }}>
                    {Object.entries(res.mastery_probabilities).map(([k, v]) => (
                      <li key={k}>
                        {k}: <b>{formatPercent(v)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {res.error && <span style={{ color: "red" }}>Error: {res.error}</span>}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
}

export default TutorQuery;