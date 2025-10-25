import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "${API_BASE}";

function StudentAssessments({ setNavBlocked }) { // Receive prop
  const location = useLocation(); // Get location object
  const [studentId, setStudentId] = useState(null);
  const [assignedTitles, setAssignedTitles] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false); // Track submission status
  const [hasSelectedOption, setHasSelectedOption] = useState(false); // Track if an option is selected

  // Inform the parent dashboard when navigation should be blocked
  useEffect(() => {
    const shouldBlock = !submitted && hasSelectedOption;
    setNavBlocked(shouldBlock);

    // Cleanup function to unblock navigation when component unmounts
    return () => {
      setNavBlocked(false);
    };
  }, [submitted, hasSelectedOption, setNavBlocked]);

  useEffect(() => {
    // Fetch logged-in student ID
    axios.get(`${API_BASE}/api/students/me`, { withCredentials: true })
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
      axios.get(`${API_BASE}/api/teacher/student-assessments/${studentId}`)
        .then((res) => setAssignedTitles(res.data))
        .catch((err) => {
          console.error(err);
          setError("Failed to load assigned assessments.");
        });
    }
  }, [studentId]);

  // Automatically load assessment if passed from another page
  useEffect(() => {
    const assessmentTitleFromState = location.state?.assessmentTitle;
    if (assessmentTitleFromState) {
      loadAssessment(assessmentTitleFromState);
    }
  }, [location.state]);


  // Prompt confirmation for browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!submitted && hasSelectedOption) {
        event.preventDefault();
        event.returnValue = "Are you sure you want to leave? Your progress will be lost.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submitted, hasSelectedOption]);

  const loadAssessment = (title) => {
    setScoreResult(null); // reset
    setAnswers({});
    setSelectedTitle(title);
    setSubmitted(false); // Reset submission state for retry
    setHasSelectedOption(false); // Reset option selection state
    axios
      .get(`${API_BASE}/api/teacher/student-assessment/${title}`)
      .then((res) => setQuestions(res.data.questions))
      .catch((err) => {
        console.error(err);
        setError("Failed to load assessment questions.");
      });
  };

  const handleSelect = (qid, choice) => {
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
    setHasSelectedOption(true); // Mark that an option has been selected
  };

  const handleSubmit = () => {
    if (!studentId || !selectedTitle) {
      setError("Missing student ID or assessment title.");
      return;
    }

    axios
      .post(
        `${API_BASE}/api/teacher/submit-assessment`,
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
        setSubmitted(true); // Mark as submitted
      })
      .catch((err) => {
        console.error(err);
        setError("Submission failed.");
      });
  };

  const handleRetry = () => {
    loadAssessment(selectedTitle); // Reload the assessment
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
                    disabled={submitted} // Disable inputs after submission
                  />
                  {choice}
                </label>
              ))}
            </div>
          ))}
          <button onClick={handleSubmit} disabled={submitted}>Submit Assessment</button>
          <button
            onClick={() => {
              if (!submitted && hasSelectedOption && !window.confirm("Are you sure you want to leave? Your progress will be lost.")) {
                return;
              }
              setSelectedTitle(null);
              setScoreResult(null); // reset score
            }}
            style={{ marginLeft: '10px' }}
          >
            Go Back
          </button>
          {submitted && (
            <button onClick={handleRetry} style={{ marginLeft: '10px' }}>
              Retry Assessment
            </button>
          )}
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