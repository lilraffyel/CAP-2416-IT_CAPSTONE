import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import StudentProgress from './StudentProgress';

function StudentHome() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Get logged-in student ID
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/students/me", { withCredentials: true })
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
      .get(`http://localhost:5000/api/teacher/student-assessments/${studentId}`)
      .then((res) => setAssignedAssessments(res.data))
      .catch(() => setAssignedAssessments([]));

    // Fetch recent results
    axios
      .get(`http://localhost:5000/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleTakeAssessment = (assessmentTitle) => {
    // Optionally, pass assessmentTitle via state or context
    navigate('/student/assessments');
  };

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
        {results.length === 0 ? (
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
              {results.slice(0, 5).map((r, idx) => (
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