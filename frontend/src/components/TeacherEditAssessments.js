import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

function TeacherEditAssessments() {
   // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [assessments, setAssessments] = useState([]); // Flat list of assessment titles
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(""); // <-- Add state for the editable title
  const [assessmentsByDomain, setAssessmentsByDomain] = useState({});
  const [domains, setDomains] = useState([]);
  const [contentDomains, setContentDomains] = useState([]);
  const [bifFiles, setBifFiles] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedBifFile, setSelectedBifFile] = useState("");
  const [competencyNodeInput, setCompetencyNodeInput] = useState("");
  const [availableNodes, setAvailableNodes] = useState([]); // <-- New state for the dropdown options

// Replace both editQuestionText and editQuestionOptions with:
const editQuestionAll = (qId, newText, newOptions, newCorrect) => {
  setQuestions(questions.map(q =>
    q.id === qId
      ? { ...q, text: newText, options: newOptions, correct: newCorrect }
      : q
  ));
};

  // Load all assessments on mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Fetch domains and bif files on mount
useEffect(() => {
  axios.get(`${API_URL}/api/teacher/domains`, { withCredentials: true })
    .then(res => setContentDomains(res.data))
    .catch(() => setContentDomains([]));
  
  // ✅ Fetch BIF files from the backend instead of hardcoding
  axios.get(`${API_URL}/api/biffiles`, { withCredentials: true })
    .then(res => setBifFiles(res.data.bif_files || []))
    .catch(() => setBifFiles([]));

}, []);

// --- NEW useEffect to fetch nodes when a BIF file is selected ---
useEffect(() => {
  if (selectedBifFile) {
    // --- FIX: Point to the updated /api/teacher/competencies route ---
    axios.get(`${API_URL}/api/teacher/competencies?bif_file=${selectedBifFile}`, { withCredentials: true })
      .then(res => {
        setAvailableNodes(res.data.competencies || []);
      })
      .catch(err => {
        console.error("Failed to fetch competencies for BIF file:", err);
        setAvailableNodes([]);
      });
  } else {
    setAvailableNodes([]); // Clear dropdown if no BIF is selected
  }
  // Reset the selected node when the BIF file changes
  setCompetencyNodeInput(""); 
}, [selectedBifFile]);

  const fetchAssessments = () => {
  axios.get(`${API_URL}/api/teacher/assessments`, { withCredentials: true })
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
    setEditingTitle(assName); // <-- Set the editable title when an assessment is selected
    
    // --- FIX: Find the full assessment object to populate all fields ---
    let assObj = null;
    for (const domain in assessmentsByDomain) {
      const found = assessmentsByDomain[domain].find(a => a.title === assName);
      if (found) {
        assObj = found;
        break;
      }
    }

    if (assObj) {
      setSelectedDomain(assObj.content_domain_id || "");
      setSelectedBifFile(assObj.bif_file || "");
      // We set the competency node here, but the useEffect for selectedBifFile will run
      // and might reset it. The value will be re-selected correctly if it exists in the new node list.
      setCompetencyNodeInput(assObj.competency_node || "");
    }

    setLoadingQuestions(true);
    axios.get(`${API_URL}/api/teacher/assessment/${encodeURIComponent(assName)}`, { withCredentials: true })
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
  if (!newAssessmentTitle.trim() || !selectedDomain) {
    alert("Please enter a title and select a content domain.");
    return;
  }
  axios.post(`${API_URL}/api/teacher/assessments`, {
    title: newAssessmentTitle,
    content_domain_id: selectedDomain,
    bif_file: selectedBifFile,
    competency_node: competencyNodeInput // <-- Add this line
  }, { withCredentials: true })
    .then(() => {
      setNewAssessmentTitle("");
      setSelectedDomain("");
      setSelectedBifFile("");
      setCompetencyNodeInput(""); // <-- Add this line
      fetchAssessments();
    })
    .catch(() => alert("Failed to add assessment."));
};

  // Delete an assessment
  const deleteAssessment = (title) => {
    if (!window.confirm("Delete this assessment and all its questions?")) return;
    axios.delete(`${API_URL}/api/teacher/assessment/${encodeURIComponent(title)}`, { withCredentials: true })
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
  // Ensure all questions have a valid 'correct' value
  const cleanedQuestions = questions.map(q => {
    let correct = q.correct || (q.options && q.options[0]) || "";
    return { ...q, correct };
  });
  console.log(cleanedQuestions);
  axios.post(
    `${API_URL}/api/teacher/assessment/${encodeURIComponent(selectedAssessment)}`,
    { questions: cleanedQuestions },
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
  {/* This input is no longer needed here, it's part of the edit section */}
  <select
    value={selectedDomain}
    onChange={e => setSelectedDomain(e.target.value)}
    style={{ marginLeft: '0.5rem' }}
  >
    <option value="">Select Domain</option>
    {contentDomains.map(domain => (
      <option key={domain.id} value={domain.id}>{domain.name}</option>
    ))}
  </select>
  <select
    value={selectedBifFile}
    onChange={e => setSelectedBifFile(e.target.value)}
    style={{ marginLeft: '0.5rem' }}
  >
    <option value="">Select BIF File</option>
    {bifFiles.map(bif => (
      <option key={bif} value={bif}>{bif}</option>
    ))}
  </select>
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
  {(assessmentsByDomain[domain] || []).map(assObj => (
    <span key={assObj.title} style={{ margin: '0rem', display: 'block', marginBottom: '0.25rem'}}> 
      <button
        style={{
          background: selectedAssessment === assObj.title ? '#3598DA' : '#ffffffff',
          color: '#000000ff',
          padding: '0.3rem',
          display: 'flex',          
          width: '50%',            
          justifyContent: 'space-between', 
          alignItems: 'center',     
        }}
        onClick={() => handleAssessmentSelect(assObj.title)}
      >
        <div style={{
        overflowWrap: "break-word",
        whiteSpace: "normal",
        flex: 1,                   
        textAlign: "left"          
      }} 
      title={assObj.title}
      >
        {assObj.title}
      </div>
      <span 
        onClick={(e) => {
          e.stopPropagation();  
          deleteAssessment(assObj.title);
        }}
        style={{ 
          color: 'white', 
          marginLeft: '0.5rem', 
          cursor: 'pointer', 
          fontSize: '15px', 
          fontWeight: 'bold', 
          borderRadius: '2px',
          backgroundColor: '#c42b1c',
          alignItems: 'center',
        }}
      >
        X
      </span>
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
    <h3>
      Editing Assessment:{" "}
      <input 
        type="text"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        style={{ fontSize: '1.17em', fontWeight: 'bold', border: '1px solid #ccc', padding: '4px' }}
      />
    </h3>
    <div style={{ marginBottom: '1rem' }}>
      <label>
        Content Domain:{" "}
        <select
          value={selectedDomain}
          onChange={e => setSelectedDomain(e.target.value)}
        >
          <option value="">Select Domain</option>
          {contentDomains.map(domain => (
            <option key={domain.id} value={domain.id}>{domain.name}</option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: '1rem' }}>
        BIF File:{" "}
        <select
          value={selectedBifFile}
          onChange={e => setSelectedBifFile(e.target.value)}
        >
          <option value="">Select BIF File</option>
          {bifFiles.map(bif => (
            <option key={bif} value={bif}>{bif}</option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: '1rem' }}>
        Competency Node:{" "}
        {/* --- CHANGE: Convert input to a dropdown --- */}
        <select
          value={competencyNodeInput}
          onChange={e => setCompetencyNodeInput(e.target.value)}
          disabled={!selectedBifFile || availableNodes.length === 0}
        >
          <option value="">-- Select Node --</option>
          {availableNodes.map(node => (
            <option key={node} value={node}>{node}</option>
          ))}
        </select>
      </label>
<button
  onClick={() => {
    axios
      .patch(
        `${API_URL}/api/teacher/assessment/${encodeURIComponent(selectedAssessment)}`,
        { 
          newTitle: editingTitle, // <-- Send the new title
          content_domain_id: selectedDomain, 
          bif_file: selectedBifFile,
          competency_node: competencyNodeInput // <-- Add this line
        },
        { withCredentials: true }
      )
      .then(() => {
        alert("Assessment updated!");
        fetchAssessments(); // Refresh the assessments after the update
        setSelectedAssessment(editingTitle); // <-- Update the selected assessment to the new title
      })
      .catch(() => alert("Failed to update assessment."));
  }}
  style={{ marginLeft: '1rem' }}
>
  Save Assessment Meta
</button>
    </div>
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
                    onEditAll={(text, opts, correct) => editQuestionAll(q.id, text, opts, correct)}// <-- add this line
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
function QuestionRow({ question, onTogglePin, onAddComment, onEditAll, onDelete }) {
  const [editText, setEditText] = useState(question.text);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editOptions, setEditOptions] = useState(question.options ? [...question.options] : ["", "", "", ""]);
  const [editCorrect, setEditCorrect] = useState(question.correct || "");

  // Keep correct answer in sync with options
  useEffect(() => {
  if (!editOptions.includes(editCorrect)) {
    setEditCorrect(editOptions[0] || "");
  }
}, [editOptions, editCorrect]);

  // When entering edit mode, sync local state with props
  useEffect(() => {
    if (showEdit) {
      setEditText(question.text);
      setEditOptions(question.options ? [...question.options] : ["", "", "", ""]);
      setEditCorrect(question.correct || (question.options && question.options[0]) || "");
    }
    // eslint-disable-next-line
  }, [showEdit]);

  return (
    <tr style={{ borderBottom: '1px solid #333' }}>
      <td style={{ padding: '8px' }}>{question.id}</td>
      <td style={{ padding: '8px' }}>
        {showEdit ? (
          <input
            style={{ width: '80%', marginBottom: '4px' }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
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
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {question.options && question.options.map((opt, i) => <li key={i}>{opt}</li>)}
          </ul>
        )}
      </td>
      <td style={{ padding: '8px' }}>
        {showEdit ? (
          <select
            value={editCorrect}
            onChange={e => setEditCorrect(e.target.value)}
            style={{ width: '90%' }}
          >
            {editOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
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
        {showEdit && (
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => {
                onEditAll(editText, editOptions, editCorrect);
                setShowEdit(false);
              }}
              style={{ marginRight: 4 }}
            >
              Save
            </button>
            <button onClick={() => setShowEdit(false)}>Cancel</button>
          </div>
        )}
      </td>
    </tr>
  );
}
export default TeacherEditAssessments;
