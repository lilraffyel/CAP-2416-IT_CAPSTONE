import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

/*function TakeAssessment() {
  const { assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/assessment/${assessmentId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch assessment.");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Assessment fetched:", data);
        setAssessment(data);
      })
      .catch((err) => {
        console.error("❌ Error fetching assessment:", err);
        setError("Failed to load assessment. Please try again later.");
      });
  }, [assessmentId]);

  const handleChange = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleSubmit = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const studentId = user?.id;

    let totalScore = 0;
    if (Array.isArray(assessment?.questions)) {
      assessment.questions.forEach((q) => {
        if (answers[q._id] === q.correctAnswer) {
          totalScore += q.score;
        }
      });
    }

    setScore(totalScore);
    setSubmitted(true);

    fetch("http://localhost:3000/submit", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, assessmentId: assessment._id, answers }),
    })
      .then((res) => res.json())
      .then((data) => console.log("✅ Submitted:", data))
      .catch((err) => console.error("❌ Error submitting assessment:", err));
  };

  if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

  if (!assessment || !Array.isArray(assessment.questions)) {
    return <p>Loading assessment...</p>;
  }

  return (
    <div>
      <h2>{assessment.title}</h2>

      {assessment.questions.length > 0 ? (
        <div>
          {assessment.questions.map((q) => (
            <div key={q._id}>
              <p>{q.text}</p>
              {q.choices && Array.isArray(q.choices) && q.choices.length > 0 ? (
                q.choices.map((choice, idx) => (
                  <label key={idx}>
                    <input
                      type="radio"
                      name={q._id}
                      value={choice}
                      onChange={() => handleChange(q._id, choice)}
                      disabled={submitted}
                    />{" "}
                    {choice}
                  </label>
                ))
              ) : (
                <>
                  <p style={{ color: "red" }}>⚠️ No choices provided for this question.</p>
                  <pre>{JSON.stringify(q, null, 2)}</pre>
                </>
              )}
            </div>
          ))}

          {!submitted ? (
            <button onClick={handleSubmit}>Submit</button>
          ) : (
            <p>Your score: {score}</p>
          )}
        </div>
      ) : (
        <p>No questions found for this assessment.</p>
      )}

      <button onClick={() => navigate("/student/assessments")}>Back</button>
    </div>
  );
} */

  import { useNavigate } from "react-router-dom";

  // Function to assign an assessment and navigate
  export function assignAssessment(studentId, assessmentId, navigate) {
    const student = STUDENTS.find((s) => s.id === studentId);
    
    if (student) {
      student.assignedAssessment = assessmentId;
      console.log(`✅ Assigned assessment ${assessmentId} to student ID ${studentId}`);
  
      // Navigate to the correct route
      navigate(`/take-assessment/${assessmentId}/student/${studentId}`);
    } else {
      console.error(`❌ Student ID ${studentId} not found!`);
    }
  }
  
  

export default TakeAssessment;
