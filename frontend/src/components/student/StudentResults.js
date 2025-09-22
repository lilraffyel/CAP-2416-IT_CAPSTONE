import React, { useEffect, useState } from "react";
import axios from "axios";

function StudentResults() {
  const [studentId, setStudentId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [sortField, setSortField] = useState("");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    // Step 1: Get logged-in student ID
    axios
      .get("http://localhost:5000/api/students/me", { withCredentials: true })
      .then((res) => {
        setStudentId(res.data.studentId);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch student data.");
      });
  }, []);

  useEffect(() => {
    if (!studentId) return;

    // Step 2: Fetch results for the fetched student ID
    axios
      .get(`http://localhost:5000/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load results.");
      });
  }, [studentId]);

  const handleSort = (field) => {
    setSortField(field);
    const sorted = [...results].sort((a, b) => {
      if (field === "date") {
        return new Date(a.date) - new Date(b.date);
      } else if (field === "score") {
        return a.score - b.score;
      }
      return 0;
    });
    setResults(sorted);
  };

  const filteredResults = results.filter((r) => {
    if (!filterText) return true;
    return r.examName.toLowerCase().includes(filterText.toLowerCase());
  });

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="content-box">
      <h2>Results</h2>
      <p>Sort by:</p>
      <button onClick={() => handleSort("date")}>Date</button>
      <button onClick={() => handleSort("score")} style={{ marginLeft: "0.5rem" }}>
        Score
      </button>

      <div style={{ marginTop: "1rem" }}>
        <label>Filter by Exam Name: </label>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="e.g. 'Add_Sub'"
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
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
  );
}

export default StudentResults;
