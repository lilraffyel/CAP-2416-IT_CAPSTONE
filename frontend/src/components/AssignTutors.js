import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function AssignTutors() {
  const [students, setStudents] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState({});
  const [message, setMessage] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHelpRequests = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/help-requests');
      setHelpRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTutors = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/tutors');
      setTutors(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/tutor-assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchStudents(),
      fetchHelpRequests(),
      fetchTutors(),
      fetchAssignments()
    ]);
  }, [fetchStudents, fetchHelpRequests, fetchTutors, fetchAssignments]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAssignTutor = async (studentId) => {
    try {
      await axios.post('http://localhost:5000/api/admin/assign-tutor', {
        studentId,
        tutorId: selectedTutor[studentId]
      });
      setMessage('Tutor assigned successfully!');
      fetchAssignments();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to assign tutor');
    }
  };

  const handleUnassignTutor = async (studentId, tutorId) => {
    try {
      await axios.post('http://localhost:5000/api/admin/unassign-tutor', {
        studentId,
        tutorId
      });
      setMessage('Tutor unassigned successfully!');
      fetchAssignments();
    } catch (err) {
      setMessage('Failed to unassign tutor');
    }
  };

  const handleRemoveHelpRequest = async (helpRequestId) => {
    try {
      await axios.post('http://localhost:5000/api/admin/remove-help-request', {
        helpRequestId
      });
      setMessage('Help request removed successfully!');
      fetchHelpRequests();
    } catch (err) {
      setMessage('Failed to remove help request');
    }
  };

  // Helper: get help requests for a student
  const getHelpRequestsForStudent = (studentId) =>
    helpRequests.filter(hr => hr.student_id === studentId);

  // Helper: get assigned tutor for a student
  const getAssignedTutorForStudent = (studentId) => {
    const assignment = assignments.find(a => a.student_id === studentId);
    return assignment ? { name: assignment.tutor_name, id: assignment.tutor_id } : null;
  };

  return (
    <div>
      <h2>Assign Tutors to Students</h2>
      {message && <p>{message}</p>}
      <table border="1" cellPadding="5" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Help Requests</th>
            <th>Assigned Tutor</th>
            <th>Assign/Unassign</th>
          </tr>
        </thead>
        <tbody>
          {students.map((stu) => {
            const assignedTutor = getAssignedTutorForStudent(stu.id);
            const studentHelpRequests = getHelpRequestsForStudent(stu.id);
            return (
              <tr key={stu.id}>
                <td>{stu.name}</td>
                <td>
                  {studentHelpRequests.length
                    ? studentHelpRequests.map(hr => (
                        <div key={hr.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {hr.domain_name}
                          <button
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => handleRemoveHelpRequest(hr.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    : 'None'}
                </td>
                <td>{assignedTutor ? assignedTutor.name : 'None'}</td>
                <td>
                  {assignedTutor ? (
                    <button onClick={() => handleUnassignTutor(stu.id, assignedTutor.id)}>
                      Unassign
                    </button>
                  ) : (
                    <>
                      <select
                        value={selectedTutor[stu.id] || ''}
                        onChange={e =>
                          setSelectedTutor({ ...selectedTutor, [stu.id]: e.target.value })
                        }
                      >
                        <option value="">Select Tutor</option>
                        {tutors.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignTutor(stu.id)}
                        disabled={!selectedTutor[stu.id]}
                      >
                        Assign
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AssignTutors;