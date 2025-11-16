import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_URL } from '../../api.js';

function StudentResults() {
  const [studentId, setStudentId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterText, setFilterText] = useState("");
  const [showScoreSortOptions, setShowScoreSortOptions] = useState(false);

  useEffect(() => {
    // Step 1: Get logged-in student ID
    axios
      // --- FIX: Use singular 'student' to match app.py ---
      .get(`${API_URL}/api/students/me`, { withCredentials: true })
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
      // --- FIX: Use singular 'student' to match app.py ---
      .get(`${API_URL}/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load results.");
      });
  }, [studentId]);

  const handleSort = (key, direction) => {
    if (direction) {
      setSortConfig({ key, direction });
    } else {
      const newDirection = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      setSortConfig({ key, direction: newDirection });
    }
    setShowScoreSortOptions(false);
  };

  const filteredAndSortedResults = useMemo(() => {
    let sortableResults = [...results];
    if (filterText) {
      sortableResults = sortableResults.filter(r =>
        r.examName.toLowerCase().includes(filterText.toLowerCase())
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
  }, [results, sortConfig, filterText]);


  if (error) return <div>Error: {error}</div>;

  return (
    <div className="content-box">
      <h2>Results</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span>Sort by:</span>
        <button onClick={() => handleSort('date')}>Date</button>
        <button onClick={() => setShowScoreSortOptions(!showScoreSortOptions)}>Score</button>
        {showScoreSortOptions && (
          <>
            <button onClick={() => handleSort('score', 'ascending')}>Ascending</button>
            <button onClick={() => handleSort('score', 'descending')}>Descending</button>
          </>
        )}
      </div>

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
          {filteredAndSortedResults.map((r, idx) => (
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
