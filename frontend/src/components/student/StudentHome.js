import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api.js';
// import StudentProgress from './StudentProgress';


function StudentHome() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterText, setFilterText] = useState('');
  const [showScoreSortOptions, setShowScoreSortOptions] = useState(false);

  // 1. Get logged-in student ID
  useEffect(() => {
    axios
      .get(`${API_URL}/api/students/me`, { withCredentials: true })
      .then((res) => {
        setStudentId(res.data.studentId);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Fetch assigned assessments and results
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);

    // Fetch assigned assessments
    axios
      .get(`${API_URL}/api/teacher/student-assessments/${studentId}`)
      .then((res) => setAssignedAssessments(res.data))
      .catch(() => setAssignedAssessments([]));

    // Fetch recent results
    axios
      .get(`${API_URL}/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleTakeAssessment = (assessmentTitle) => {
    // --- FIX: Pass the assessmentTitle in the navigation state ---
    navigate('/student/assessments', { state: { assessmentTitle } });
  };

  const handleSort = (key, direction) => {
    // If direction is provided, use it. Otherwise, toggle.
    if (direction) {
      setSortConfig({ key, direction });
    } else {
      const newDirection = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      setSortConfig({ key, direction: newDirection });
    }
    setShowScoreSortOptions(false); // Hide options after selection
  };

  const filteredAndSortedResults = useMemo(() => {
    let sortableResults = [...results];

    // Filter results
    if (filterText) {
      sortableResults = sortableResults.filter(r =>
        r.examName.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Sort results
    sortableResults.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableResults;
  }, [results, sortConfig, filterText]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="content-box">
      <h2>Welcome to Your Student Home</h2>
      <p>
        This page shows your currently assigned assessments and a quick look at your recent results.
      </p>

      {/* =============== NEW ASSIGNMENTS =============== */}
      <section style={{ marginBottom: '2rem' }}>
        <h3>Assigned Assessments</h3>
        {assignedAssessments.length === 0 ? (
          <p>No assessments assigned at the moment.</p>
        ) : (
          <ul>
            {assignedAssessments.map((title, idx) => (
              <li key={idx} style={{ margin: '0.5rem 0' }}>
                <strong>{title}</strong>
                <button
                  style={{ marginLeft: '1rem' }}
                  onClick={() => handleTakeAssessment(title)}
                >
                  Take Assessment
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* =============== RECENT RESULTS =============== */}
      <section>
        <h3>Your Recent Results</h3>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => handleSort('date')}>Sort by Date</button>
          <button onClick={() => setShowScoreSortOptions(!showScoreSortOptions)}>Sort by Score</button>
          {showScoreSortOptions && (
            <>
              <button onClick={() => handleSort('score', 'ascending')}>Ascending</button>
              <button onClick={() => handleSort('score', 'descending')}>Descending</button>
            </>
          )}
          <input
            type="text"
            placeholder="Filter by exam name..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ padding: '6px' }}
          />
        </div>
        {filteredAndSortedResults.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #444" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Exam Name</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedResults.slice(0, 5).map((r, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #333" }}>
                  <td style={{ padding: "8px" }}>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{ padding: "8px" }}>{r.examName}</td>
                  <td style={{ padding: "8px" }}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default StudentHome;