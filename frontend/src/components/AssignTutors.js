// src/components/admin/TutorAssign.js
/*
import React, { useEffect, useState } from "react";
import axios from "axios";

function TutorAssign() {
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("");
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchTutors();
    fetchAssignments();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/students");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTutors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/tutors");
      setTutors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/tutor-assignments");
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!selectedStudent || !selectedTutor) return;

    try {
      await axios.post("http://localhost:5000/api/admin/assign-tutor", {
        studentId: selectedStudent,
        tutorId: selectedTutor,
      });
      fetchAssignments(); // Refresh table
      setSelectedStudent("");
      setSelectedTutor("");
      alert("Tutor assigned successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to assign tutor.");
    }
  };

  return (
    <div>
      <h2>Assign Tutors to Students</h2>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={selectedTutor} onChange={(e) => setSelectedTutor(e.target.value)}>
          <option value="">Select Tutor</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button onClick={handleAssign}>Assign</button>
      </div>

      <h3>Existing Assignments</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Student</th>
            <th>Tutor</th>
            <th>Assigned At</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id}>
              <td>{a.student_name}</td>
              <td>{a.tutor_name}</td>
              <td>{a.assigned_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TutorAssign;
*/

// src/components/admin/TutorAssign.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AssignTutors() {
  const [helpRequests, setHelpRequests] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState({}); // track selection per helpRequest
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchHelpRequests();
    fetchTutors();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/help-requests');
      setHelpRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTutors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/tutors');
      setTutors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTutor = async (helpRequestId) => {
    try {
      await axios.post('http://localhost:5000/api/admin/assign-tutor', {
        help_request_id: helpRequestId,
        tutor_id: selectedTutor[helpRequestId]
      });
      setMessage('Tutor assigned successfully!');
      fetchHelpRequests();
    } catch (err) {
      console.error(err);
      setMessage('Failed to assign tutor');
    }
  };

  return (
    <div>
      <h2>Assign Tutors to Help Requests</h2>
      {message && <p>{message}</p>}
      <table border="1" cellPadding="5" style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Student</th>
            <th>Domain</th>
            <th>Status</th>
            <th>Assign Tutor</th>
          </tr>
        </thead>
        <tbody>
          {helpRequests.map((hr) => (
            <tr key={hr.id}>
              <td>{hr.student_name}</td>
              <td>{hr.domain_name}</td>
              <td>{hr.status}</td>
              <td>
                <select
                  value={selectedTutor[hr.id] || ''}
                  onChange={(e) =>
                    setSelectedTutor({
                      ...selectedTutor,
                      [hr.id]: e.target.value
                    })
                  }
                >
                  <option value="">Select Tutor</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignTutor(hr.id)}
                  disabled={!selectedTutor[hr.id]}
                >
                  Assign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssignTutors;


