import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

import { API_URL } from '../api.js';

function AssignTutors() {
  const [students, setStudents] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState({});
  const [message, setMessage] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/students`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchHelpRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/help-requests`);
      setHelpRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTutors = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/tutors`);
      setTutors(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/tutor-assignments`);
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
      await axios.post(`${API_URL}/api/admin/assign-tutor`, {
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
      await axios.post(`${API_URL}/api/admin/unassign-tutor`, {
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
      await axios.post(`${API_URL}/api/admin/remove-help-request`, {
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

  // --- FIX: Change to get an array of all assigned tutors ---
  const getAssignedTutorsForStudent = (studentId) => {
    return assignments.filter(a => a.student_id === studentId);
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
            // --- FIX: Get all assigned tutors, not just the first one ---
            const assignedTutors = getAssignedTutorsForStudent(stu.id);
            return (
              <tr key={stu.id}>
                <td>{stu.name}</td>
                <td>
                  {getHelpRequestsForStudent(stu.id).length
                    ? getHelpRequestsForStudent(stu.id).map(hr => (
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
                {/* --- FIX: Display a list of tutors --- */}
                <td>
                  {assignedTutors.length > 0 ? (
                    <ul>
                      {assignedTutors.map(tutor => (
                        <li key={tutor.tutor_id}>
                          {tutor.tutor_name}{' '}
                          <button onClick={() => handleUnassignTutor(stu.id, tutor.tutor_id)}>
                            Unassign
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'None'
                  )}
                </td>
                {/* --- FIX: Always show the assignment dropdown --- */}
                <td>
                  <select
                    value={selectedTutor[stu.id] || ''}
                    onChange={e =>
                      setSelectedTutor({ ...selectedTutor, [stu.id]: e.target.value })
                    }
                  >
                    <option value="">Select Tutor to Add</option>
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