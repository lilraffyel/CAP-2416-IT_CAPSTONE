import React, { useEffect, useState } from "react";
import axios from "axios";

function StudentAssessments() {
  const [studentId, setStudentId] = useState(null);
  const [assignedTitles, setAssignedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch logged-in student ID
    axios.get("http://localhost:5000/api/students/me", { withCredentials: true })
      .then((res) => {
        setStudentId(res.data.studentId);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch student info.");
      });
  }, []);

  useEffect(() => {
    if (studentId) {
      axios.get(`http://localhost:5000/api/teacher/student-assessments/${studentId}`)
        .then((res) => setAssignedTitles(res.data))
        .catch((err) => {
          console.error(err);
          setError("Failed to load assigned assessments.");
        });
    }
  }, [studentId]);

  const loadAssessment = (title) => {
    setScoreResult(null); // reset
    setAnswers({});
    setSelectedTitle(title);
    axios
      .get(`http://localhost:5000/api/teacher/student-assessment/${title}`)
      .then((res) => setQuestions(res.data.questions))
      .catch((err) => {
        console.error(err);
        setError("Failed to load assessment questions.");
      });
  };

  const handleSelect = (qid, choice) => {
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
  };

  const handleSubmit = () => {
    if (!studentId || !selectedTitle) {
      setError("Missing student ID or assessment title.");
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/teacher/submit-assessment",
        {
          studentId,
          assessmentTitle: selectedTitle,
          answers,
        },
        { withCredentials: true }
      )
      .then((res) => {
        setScoreResult(res.data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Submission failed.");
      });
  };

  return (
    <div className="content-box">
      <h2>Take Your Assessment</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!selectedTitle && (
        <>
          <p>Select an assigned assessment:</p>
          {assignedTitles.map((title) => (
            <button key={title} onClick={() => loadAssessment(title)} style={{ margin: '5px' }}>
              {title}
            </button>
          ))}
          {assignedTitles.length === 0 && <p>No assessments assigned.</p>}
        </>
      )}

      {selectedTitle && questions.length > 0 && (
        <div>
          <h3>{selectedTitle}</h3>
          {questions.map((q, index) => (
            <div key={q.id} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>Q{index + 1}:</strong> {q.text}
              </p>
              {q.choices.map((choice) => (
                <label key={choice} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={choice}
                    checked={answers[q.id] === choice}
                    onChange={() => handleSelect(q.id, choice)}
                  />
                  {choice}
                </label>
              ))}
            </div>
          ))}
          <button onClick={handleSubmit}>Submit Assessment</button>
          <button
            onClick={() => {
              setSelectedTitle(null);
              setScoreResult(null); // reset score
            }}
            style={{ marginLeft: '10px' }}
          >
            Go Back
          </button>
        </div>
      )}

      {scoreResult && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Score:</strong> {scoreResult.score} / {scoreResult.total}
        </div>
      )}
    </div>
  );
}

export default StudentAssessments;
