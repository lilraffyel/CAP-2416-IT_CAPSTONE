import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TeacherEditAssessments() {
   // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [assessments, setAssessments] = useState([]); // Flat list of assessment titles
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
  const [assessmentsByDomain, setAssessmentsByDomain] = useState({});
  const [domains, setDomains] = useState([]);

  // Load all assessments on mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = () => {
  axios.get("http://localhost:5000/api/teacher/assessments", { withCredentials: true })
    .then(res => {
      setAssessmentsByDomain(res.data);
      setDomains(Object.keys(res.data));
    })
    .catch(() => {
      setAssessmentsByDomain({});
      setDomains([]);
    });
};

  // Select an assessment and load its questions
  const handleAssessmentSelect = (assName) => {
    setSelectedAssessment(assName);
    setLoadingQuestions(true);
    axios.get(`http://localhost:5000/api/teacher/assessment/${encodeURIComponent(assName)}`, { withCredentials: true })
      .then(res => {
        setQuestions(res.data);
        setLoadingQuestions(false);
      })
      .catch(() => {
        setQuestions([]);
        setLoadingQuestions(false);
      });
  };

  // Add a new assessment
  const addAssessment = () => {
    if (!newAssessmentTitle.trim()) return;
    if (assessments.includes(newAssessmentTitle)) {
      alert("Assessment already exists.");
      return;
    }
    axios.post("http://localhost:5000/api/teacher/assessments", { title: newAssessmentTitle }, { withCredentials: true })
      .then(() => {
        setNewAssessmentTitle("");
        fetchAssessments();
      })
      .catch(() => alert("Failed to add assessment."));
  };

  // Delete an assessment
  const deleteAssessment = (title) => {
    if (!window.confirm("Delete this assessment and all its questions?")) return;
    axios.delete(`http://localhost:5000/api/teacher/assessment/${encodeURIComponent(title)}`, { withCredentials: true })
      .then(() => {
        if (selectedAssessment === title) {
          setSelectedAssessment(null);
          setQuestions([]);
        }
        fetchAssessments();
      })
      .catch(() => alert("Failed to delete assessment."));
  };

  // Add a new question (local only until saved)
  const addQuestion = () => {
  if (!selectedAssessment) return;
  if (questions.length >= 10) {
    alert("You can only add up to 10 questions per assessment.");
    return;
  }
  const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id || 0)) + 1 : 1;
  const newQuestion = {
    id: newId,
    text: "New question text",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correct: "Option 1",
    pinned: false,
    comments: []
  };
  setQuestions([...questions, newQuestion]);
};

  // Toggle the pinned status of a question (local only)
  const togglePin = (qId) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, pinned: !q.pinned } : q));
  };

  // Add a comment to a question (local only)
  const addComment = (qId, commentText) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, comments: [...q.comments, commentText] } : q));
  };

  // Edit a question’s text (local only)
  const editQuestionText = (qId, newText) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: newText } : q));
  };

  // Delete a question from the assessment (local only)
  const deleteQuestion = (qId) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  // Save changes to questions for the selected assessment (persist to backend)
  const saveChanges = () => {
    if (!selectedAssessment) return;
    axios.post(
      `http://localhost:5000/api/teacher/assessment/${encodeURIComponent(selectedAssessment)}`,
      { questions },
      { withCredentials: true }
    )
      .then(() => {
        alert("Assessment questions saved to database!");
      })
      .catch(() => {
        alert("Failed to save changes.");
      });
  };

  return (
    <div className="content-box">
      <h2>Create/Edit Assessments</h2>
      <p>
        Select an assessment to edit questions. You can edit the question text, toggle the pinned status, add comments, delete questions, or add new questions.
      </p>

      {/* Add New Assessment */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>Add New Assessment:</strong>{" "}
        <input
          type="text"
          value={newAssessmentTitle}
          onChange={e => setNewAssessmentTitle(e.target.value)}
          placeholder="Assessment Title"
        />
        <button onClick={addAssessment} style={{ marginLeft: '0.5rem' }}>
          Add Assessment
        </button>
      </div>

      {/* Assessment List */}
      <div style={{ marginBottom: '1rem' }}>
  <strong>Assessments by Content Domain:</strong>
  {domains.length === 0 ? (
    <div>No assessments found.</div>
  ) : (
    domains.map(domain => (
      <div key={domain} style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>{domain}</div>
        {(assessmentsByDomain[domain] || []).map(assName => (
          <span key={assName} style={{ marginRight: '1rem' }}>
            <button
              style={{
                background: selectedAssessment === assName ? '#2980b9' : '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.8rem',
                marginRight: '0.3rem'
              }}
              onClick={() => handleAssessmentSelect(assName)}
            >
              {assName}
            </button>
            <button
              onClick={() => deleteAssessment(assName)}
              style={{
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.3rem 0.5rem'
              }}
              title="Delete assessment"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    ))
  )}
</div>

      {/* Questions Table */}
      {selectedAssessment && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Editing Assessment: {selectedAssessment}</h3>
          <button onClick={addQuestion} style={{ marginBottom: '1rem' }}>Add Question</button>
          {loadingQuestions ? (
            <div>Loading questions...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Text</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Options</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Correct</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pinned</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Comments</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    onTogglePin={() => togglePin(q.id)}
                    onAddComment={(cmt) => addComment(q.id, cmt)}
                    onEditText={(txt) => editQuestionText(q.id, txt)}
                    onDelete={() => deleteQuestion(q.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
          <button onClick={saveChanges} style={{ marginTop: '1rem' }}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

// Sub-component to render each question row with edit and delete options
function QuestionRow({ question, onTogglePin, onAddComment, onEditText, onDelete }) {
  const [editText, setEditText] = useState(question.text);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editOptions, setEditOptions] = useState(question.options ? [...question.options] : ["", "", "", ""]);
  const [editCorrect, setEditCorrect] = useState(question.correct || "");

  return (
    <tr style={{ borderBottom: '1px solid #333' }}>
      <td style={{ padding: '8px' }}>{question.id}</td>
      <td style={{ padding: '8px' }}>
        {showEdit ? (
          <div>
            <input
              style={{ width: '80%', marginBottom: '4px' }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div>
              <button onClick={() => { onEditText(editText); setShowEdit(false); }}>Save</button>
              <button onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {question.text}
            <button style={{ marginLeft: '1rem' }} onClick={() => setShowEdit(true)}>Edit</button>
          </>
        )}
      </td>
      <td style={{ padding: '8px' }}>
        {showEdit ? (
          <div>
            {editOptions.map((opt, i) => (
              <input
                key={i}
                style={{ display: 'block', marginBottom: 2, width: '90%' }}
                value={opt}
                onChange={e => {
                  const opts = [...editOptions];
                  opts[i] = e.target.value;
                  setEditOptions(opts);
                }}
              />
            ))}
            <button
              onClick={() => {
                onEditText(editText);
                question.options = [...editOptions];
                setShowEdit(false);
              }}
              style={{ marginTop: 4 }}
            >Save Options</button>
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {question.options && question.options.map((opt, i) => <li key={i}>{opt}</li>)}
          </ul>
        )}
      </td>
      <td style={{ padding: '8px' }}>
        {showEdit ? (
          <input
            value={editCorrect}
            onChange={e => setEditCorrect(e.target.value)}
            style={{ width: '90%' }}
          />
        ) : (
          question.correct
        )}
      </td>
      <td style={{ padding: '8px' }}>
        <input type="checkbox" checked={question.pinned} onChange={onTogglePin} /> Pin
      </td>
      <td style={{ padding: '8px' }}>
        <ul style={{ marginTop: 0 }}>
          {question.comments && question.comments.map((c, i) => (
            <li key={i} style={{ marginBottom: '4px', color: '#ff0' }}>{c}</li>
          ))}
        </ul>
        <div style={{ marginTop: '0.5rem' }}>
          <input
            placeholder="Add comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ width: '70%' }}
          />
          <button
            onClick={() => {
              if (commentText.trim()) {
                onAddComment(commentText.trim());
                setCommentText("");
              }
            }}
            style={{ marginLeft: '0.5rem' }}
          >
            +
          </button>
        </div>
      </td>
      <td style={{ padding: '8px' }}>
        <button onClick={onDelete} style={{ background: 'red', color: 'white' }}>Delete</button>
      </td>
    </tr>
  );
}

export default TeacherEditAssessments;