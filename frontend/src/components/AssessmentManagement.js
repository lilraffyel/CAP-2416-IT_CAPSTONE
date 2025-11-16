import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../api.js';

function AssessmentManagement() {
  // console.log("API_URL:", API_URL);
  const [assessments, setAssessments] = useState([]);
  const [editAssessmentId, setEditAssessmentId] = useState(null);
  const [editScore, setEditScore] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all student assessment results on mount
  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/teacher/latest-results`, { withCredentials: true })
      .then((res) => setAssessments(res.data))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  };

  const handleEdit = (assessment) => {
    setEditAssessmentId(assessment.result_id);
    setEditScore(assessment.score);
  };

  const handleSave = (id) => {
    // You would need a backend endpoint to update a result's score if you want to support editing.
    // For now, just update locally:
    setAssessments(
      assessments.map((a) =>
        a.result_id === id ? { ...a, score: Number(editScore) } : a
      )
    );
    setEditAssessmentId(null);
    setEditScore("");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this student result?")) return;
    axios
      .delete(`${API_URL}/api/teacher/result/${id}`, { withCredentials: true })
      .then(() => {
        setAssessments(assessments.filter((a) => a.result_id !== id));
      })
      .catch(() => alert("Failed to delete result."));
  };

  const getPerformanceTrend = () => {
    const trends = {};
    assessments.forEach((a) => {
      if (!trends[a.competency]) trends[a.competency] = [];
      trends[a.competency].push(a.score);
    });
    return Object.entries(trends).map(([competency, scores]) => ({
      competency,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    }));
  };

  const trends = getPerformanceTrend();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Assessment Management</h2>
      <h3>Student Assessment Results</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Competency</th>
            <th>Score</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((assessment) => (
            <tr key={assessment.result_id}>
              <td>{assessment.result_id}</td>
              <td>{assessment.student_id}</td>
              <td>{assessment.competency}</td>
              <td>
                {editAssessmentId === assessment.result_id ? (
                  <input
                    type="number"
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                  />
                ) : (
                  assessment.score
                )}
              </td>
              <td>{assessment.total}</td>
              <td>
                {editAssessmentId === assessment.result_id ? (
                  <>
                    <button onClick={() => handleSave(assessment.result_id)}>
                      Save
                    </button>
                    <button onClick={() => setEditAssessmentId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(assessment)}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(assessment.result_id)}
                      style={{ marginLeft: "0.5rem", background: "red", color: "white" }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Performance Trends</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Competency</th>
            <th>Average Score</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((trend) => (
            <tr key={trend.competency}>
              <td>{trend.competency}</td>
              <td>{trend.average.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssessmentManagement;