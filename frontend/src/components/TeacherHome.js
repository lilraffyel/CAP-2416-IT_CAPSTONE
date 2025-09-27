import React, { useState, useEffect } from 'react';

function TeacherHome() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [allAssessments, setAllAssessments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  // Fetch students on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/teacher/students')
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(console.error);
  }, []);

  // Fetch all assessments (latest results)
  useEffect(() => {
    fetch('http://localhost:5000/api/teacher/latest-results')
      .then(res => res.json())
      .then(data => setAllAssessments(data))
      .catch(console.error);
  }, []);

  const handleStudentClick = (studentId) => {
    setSelectedStudent(prev => (prev === studentId ? null : studentId));
    setSelectedDomain('');
    setSelectedCompetency('');
    setEditingCommentId(null);
    setCommentDraft('');
  };

  const handleEditComment = (assessment) => {
    const key = `${assessment.student_id}-${assessment.assessment_name}`;
    setEditingCommentId(key);
    setCommentDraft(assessment.comment || '');
  };

  const handleSaveComment = async (assessment) => {
    // Find matching result to get result_id
    const matchingResult = allAssessments.find(
      a => a.student_id === assessment.student_id && a.assessment_name === assessment.assessment_name
    );

    if (!matchingResult) return;

    try {
      const res = await fetch('http://localhost:5000/api/teacher/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId: matchingResult.result_id, comment: commentDraft }),
      });

      if (res.ok) {
        // Update local state
        setAllAssessments(prev => prev.map(a => {
          if (a.result_id === matchingResult.result_id) {
            return { ...a, comment: commentDraft };
          }
          return a;
        }));
        setEditingCommentId(null);
        setCommentDraft('');
      } else {
        alert('Failed to save comment');
      }
    } catch (error) {
      alert('Error saving comment: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setCommentDraft('');
  };

  // Delete result handler
  const handleDelete = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/result/${resultId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setAllAssessments(prev => prev.filter(a => a.result_id !== resultId));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  // Filter assessments based on selected student, domain, and competency
  const filteredAssessments = allAssessments.filter(a =>
    a.student_id === selectedStudent &&
    (!selectedDomain || a.domain === selectedDomain) &&
    (!selectedCompetency || a.competency === selectedCompetency)
  );

  // Filter competencies by selected domain to show only relevant competencies in dropdown
  const competenciesForDomain = allAssessments
    .filter(a => a.student_id === selectedStudent && (!selectedDomain || a.domain === selectedDomain))
    .map(a => a.competency);

  const uniqueCompetencies = [...new Set(competenciesForDomain)];

  // Extract unique domains for dropdown based on selected student
  const domainsForStudent = allAssessments
    .filter(a => a.student_id === selectedStudent)
    .map(a => a.domain);

  const uniqueDomains = [...new Set(domainsForStudent)];

  // ---------- STYLES ----------

  const containerStyle = {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '1rem',
    border: '1px solid #444',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
    backgroundColor: '#333',
    color: '#fff',
  };

  const studentButtonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '0.25rem 0.75rem',
    margin: '0.25rem 0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    textAlign: 'left',
    width: 'auto',
  };

  const dropdownContainerStyle = {
    margin: '1rem 0',
    padding: '0.5rem',
    border: '1px solid #555',
    borderRadius: '4px',
    backgroundColor: '#444',
  };

  const selectStyle = {
    padding: '0.5rem',
    marginRight: '1rem',
    borderRadius: '4px',
    border: '1px solid #777',
    fontSize: '1rem',
    backgroundColor: '#fff',
    color: '#000',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  };

  const thStyle = {
    border: '1px solid #666',
    padding: '0.5rem',
    backgroundColor: '#555',
    color: '#fff',
  };

  const tdStyle = {
    border: '1px solid #666',
    padding: '0.5rem',
    textAlign: 'center',
    color: '#fff',
  };

  const buttonStyle = {
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    margin: '0 0.25rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e74c3c',
  };

  return (
    <div className="content-box" style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#fff' }}>Student Competencies</h2>
      {students.map((student) => (
        <div key={student.id}>
          <button
            style={studentButtonStyle}
            onClick={() => handleStudentClick(student.id)}
          >
            {student.name}
          </button>

          {selectedStudent === student.id && (
            <div className="dropdown-container" style={dropdownContainerStyle}>
              <div style={{ marginBottom: '1rem' }}>
                <select
                  value={selectedDomain}
                  onChange={(e) => {
                    setSelectedDomain(e.target.value);
                    setSelectedCompetency(''); // reset competency when domain changes
                  }}
                  style={selectStyle}
                >
                  <option value="">Select Domain</option>
                  {uniqueDomains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>

                <select
                  value={selectedCompetency}
                  onChange={(e) => setSelectedCompetency(e.target.value)}
                  style={selectStyle}
                  disabled={!selectedDomain}
                >
                  <option value="">Select Competency</option>
                  {uniqueCompetencies.map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
              </div>

              {filteredAssessments.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Assessment</th>
                      <th style={thStyle}>Score</th>
                      <th style={thStyle}>Attempts</th>
                      <th style={thStyle}>Comment</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.map((assessment) => {
                      const key = `${assessment.student_id}-${assessment.assessment_name}`;
                      return (
                        <tr key={key}>
                          <td style={tdStyle}>{assessment.assessment_name}</td>
                          <td style={tdStyle}>
                            {Math.round((assessment.score / assessment.total) * 100)}%
                          </td>
                          <td style={tdStyle}>{assessment.attempt || 1}</td>
                          <td style={tdStyle}>
                            {editingCommentId === key ? (
                              <>
                                <input
                                  type="text"
                                  value={commentDraft}
                                  onChange={(e) => setCommentDraft(e.target.value)}
                                  style={{ padding: '0.25rem', width: '70%' }}
                                />
                                <button
                                  style={buttonStyle}
                                  onClick={() => handleSaveComment(assessment)}
                                >
                                  Save
                                </button>
                                <button
                                  style={buttonStyle}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span>{assessment.comment || ''}</span>
                                <button
                                  style={buttonStyle}
                                  onClick={() => handleEditComment(assessment)}
                                >
                                  Add/Edit
                                </button>
                              </>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <button
                              style={dangerButtonStyle}
                              onClick={() => handleDelete(assessment.result_id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: '1rem', color: '#ccc' }}>
                  No assessments found for the selected filters.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TeacherHome;
