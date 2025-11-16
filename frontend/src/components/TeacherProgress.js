import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api.js';

function TeacherProgress() {
  const [students, setStudents] = useState([]);
  const [domains, setDomains] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [tutorId, setTutorId] = useState(null);

  const [domainSelections, setDomainSelections] = useState({});
  const [competencySelections, setCompetencySelections] = useState({});
  const [dummyRefresh, setDummyRefresh] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/api/me`, { withCredentials: true })
      .then(res => setTutorId(res.data.tutorId))
      .catch(console.error);

    axios.get(`${API_URL}/api/teacher/domains`)
      .then(res => setDomains(res.data))
      .catch(console.error);

    axios.get(`${API_URL}/api/teacher/competencies`)
      .then(res => setCompetencies(res.data))
      .catch(console.error);

    axios.get(`${API_URL}/api/teacher/help-requests`)
      .then(res => setHelpRequests(res.data))
      .catch(console.error);

    axios.get(`${API_URL}/api/teacher/assignments`)
      .then(res => setAssignments(res.data))
      .catch(console.error);
  }, [dummyRefresh]);

  useEffect(() => {
    if (tutorId) {
      axios.get(`${API_URL}/api/teacher/students?tutor_id=${tutorId}`)
        .then(res => setStudents(res.data))
        .catch(console.error);
    }
  }, [tutorId, dummyRefresh]);

  const getHelpRequestsForStudent = (stuId) => {
    return helpRequests
      .filter(hr => hr.studentId === stuId)
      .map(hr => hr.domain);
  };

  const getAssignedForStudent = (stuId) => {
    return assignments[stuId] || [];
  };

  const handleDomainChange = (stuId, newDomain) => {
    setDomainSelections(prev => ({ ...prev, [stuId]: newDomain }));
    setCompetencySelections(prev => ({ ...prev, [stuId]: '' }));
  };

  const handleCompetencyChange = (stuId, newComp) => {
    setCompetencySelections(prev => ({ ...prev, [stuId]: newComp }));
  };

  const handleAssign = (stuId) => {
    const chosenComp = competencySelections[stuId];
    if (!chosenComp) return alert('Please select a competency first!');

    axios.post(`${API_URL}/api/teacher/assign`, {
      studentId: stuId,
      competencyId: chosenComp,
      tutorId: tutorId,
    })
      .then(() => {
        alert(`Assigned competency to student ID ${stuId}.`);
        setDummyRefresh(prev => prev + 1);
      })
      .catch(() => alert('Failed to assign competency.'));
  };

  // NEW: Remove/unassign a competency from a student
  const handleUnassign = (stuId, compId) => {
    axios.post(`${API_URL}/api/teacher/unassign`, {
      studentId: stuId,
      competencyId: compId,
      tutorId: tutorId,
    })
      .then(() => {
        alert(`Unassigned competency from student ID ${stuId}.`);
        setDummyRefresh(prev => prev + 1);
      })
      .catch(() => alert('Failed to unassign competency.'));
  };

  return (
    <div className="content-box">
      <h2>Student Assignments</h2>
      <p>See which students requested help, and assign them a domain and competency to work on.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Student</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Help Requests</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Assigned Assessment</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Domain</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Competency</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '8px' }}>Loading or no students found.</td>
            </tr>
          ) : (
            students.map((stu) => {
              const requests = getHelpRequestsForStudent(stu.id);
              const currentDomain = domainSelections[stu.id] || '';
              const domainObj = domains.find(d => d.name === currentDomain);
              const possibleComps = domainObj
                ? competencies.filter(c => c.content_domain_id === domainObj.id)
                : [];
              const currentComp = competencySelections[stu.id] || '';
              const assigned = getAssignedForStudent(stu.id);

              return (
                <tr key={stu.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px' }}>{stu.name || stu.id}</td>
                  <td style={{ padding: '8px' }}>
                    {requests.length ? requests.join(', ') : 'None'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {assigned.length ? assigned.map(compId => {
                      // Find the competency label for display
                      const compObj = competencies.find(c => c.id === compId);
                      return (
                        <span key={compId} style={{ display: 'inline-block', marginRight: 8 }}>
                          {compObj ? compObj.label : compId}
                          <button
                            style={{
                              marginLeft: 4,
                              background: 'none',
                              border: 'none',
                              color: 'red',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                            title="Remove"
                            onClick={() => handleUnassign(stu.id, compId)}
                          >✕</button>
                        </span>
                      );
                    }) : 'None'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select
                      value={currentDomain}
                      onChange={(e) => handleDomainChange(stu.id, e.target.value)}
                    >
                      <option value="">-- Select Domain --</option>
                      {domains.map(domain => (
                        <option key={domain.id} value={domain.name}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select
                      value={currentComp}
                      onChange={(e) => handleCompetencyChange(stu.id, e.target.value)}
                      disabled={!currentDomain}
                    >
                      <option value="">-- Select Competency --</option>
                      {possibleComps.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleAssign(stu.id)}>Assign</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TeacherProgress;