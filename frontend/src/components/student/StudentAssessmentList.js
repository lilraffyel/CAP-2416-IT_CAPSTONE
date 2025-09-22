
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentAssessmentList() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const studentId = user?.id;

    if (!studentId) {
      console.error("No student ID found. Are you logged in?");
      return;
    }

    fetch(`http://localhost:3000/assigned/${studentId}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch assessments");
        return res.json();
      })
      .then((data) => {
        setAssessments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching assessments:", err);
        setLoading(false);
      });
  }, []);

  const handleTakeAssessment = (assessment) => {
    navigate(`/student/assessment/${assessment._id}`, { state: { assessment } });
  };

  if (loading) return <p>Loading assessments...</p>;

  return (
    <div>
      <h2>Your Assigned Assessments</h2>
      {assessments.length === 0 ? (
        <p>No assessments assigned.</p>
      ) : (
        <ul>
          {assessments.map((assess) => (
            <li key={assess._id} style={{ marginBottom: "1rem" }}>
              <h3>{assess.title}</h3>
              <p>Domain: {assess.contentDomain} | Grade: {assess.gradeLevel}</p>
              <button onClick={() => handleTakeAssessment(assess)}>Take Assessment</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudentAssessmentList;
