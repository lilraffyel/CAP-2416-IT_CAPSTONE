import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "${API_BASE}";

function UserManagement() {
  // Student states
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: "", password: "" });
  const [editStudentId, setEditStudentId] = useState(null);
  const [editStudentData, setEditStudentData] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [studentButtonDisabled, setStudentButtonDisabled] = useState(false);
  const [tutorButtonDisabled, setTutorButtonDisabled] = useState(false);
 
  // Tutor states
  const [tutors, setTutors] = useState([]);
  const [newTutor, setNewTutor] = useState({ name: "", password: "" });
  const [editTutorId, setEditTutorId] = useState(null);
  const [editTutorData, setEditTutorData] = useState({ name: "", password: "" });

  // Fetch students and tutors from backend API on mount
  useEffect(() => {
    axios.get(`${API_BASE}/api/users/students`, { withCredentials: true })
      .then(res => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch students");
        setLoading(false);
      });

    axios.get(`${API_BASE}/api/users/tutors`, { withCredentials: true })
      .then(res => setTutors(res.data))
      .catch(() => setTutors([]));
  }, []);

  // Add new student
  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.password) {
      alert("Please enter both name and password");
      return;
    }

    const payload = {
      id: newStudent.name.toLowerCase().replace(/\s+/g, ""),
      name: newStudent.name,
      password: newStudent.password,
      role: "Student",
    };

    setStudentButtonDisabled(true);

    axios.post(`${API_BASE}/api/users/add-student`, payload, { withCredentials: true })
      .then(() => {
        setStudents([...students, { id: payload.id, name: payload.name }]);
        setNewStudent({ name: "", password: "" });
        setTimeout(() => setStudentButtonDisabled(false), 10000);
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to add student");
         setStudentButtonDisabled(false);
      });
  };

  // Add new tutor
  const handleAddTutor = () => {
    if (!newTutor.name || !newTutor.password) {
      alert("Please enter both name and password");
      return;
    }
    const payload = {
      id: newTutor.name.toLowerCase().replace(/\s+/g, ""),
      name: newTutor.name,
      password: newTutor.password,
      role: "Tutor",
    };

    setTutorButtonDisabled(true);

    axios.post(`${API_BASE}/api/users/add-tutor`, payload, { withCredentials: true })
      .then(() => {
        setTutors([...tutors, { id: payload.id, name: payload.name }]);
        setNewTutor({ name: "", password: "" });
         setTimeout(() => setTutorButtonDisabled(false), 10000);
      })
      
      .catch(err => {
        alert(err.response?.data?.error || "Failed to add tutor");
        setTutorButtonDisabled(false);
      });
  };

  // Start editing student
  const handleEditStudent = (student) => {
    setEditStudentId(student.id);
    setEditStudentData({ name: student.name, password: "" });
  };

  // Save edited student
  const handleSaveEdit = () => {
    if (!editStudentData.name) {
      alert("Name cannot be empty");
      return;
    }

    const payload = {
      name: editStudentData.name,
      password: editStudentData.password || undefined,
    };

    axios.put(`${API_BASE}/api/users/edit-student/${editStudentId}`, payload, { withCredentials: true })
      .then(() => {
        setStudents(students.map(s => s.id === editStudentId ? { ...s, name: editStudentData.name } : s));
        setEditStudentId(null);
        setEditStudentData({ name: "", password: "" });
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to update student");
      });
  };

  // Remove student
  const handleRemoveStudent = (id) => {
    if (!window.confirm("Are you sure you want to remove this student?")) return;

    axios.delete(`${API_BASE}/api/users/delete-student/${id}`, { withCredentials: true })
      .then(() => {
        setStudents(students.filter(s => s.id !== id));
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to delete student");
      });
  };

  // Start editing tutor
  const handleEditTutor = (tutor) => {
    setEditTutorId(tutor.id);
    setEditTutorData({ name: tutor.name, password: "" });
  };

  // Save edited tutor
  const handleSaveEditTutor = () => {
    if (!editTutorData.name) {
      alert("Name cannot be empty");
      return;
    }
    const payload = {
      name: editTutorData.name,
      password: editTutorData.password || undefined,
    };
    axios.put(`${API_BASE}/api/users/edit-tutor/${editTutorId}`, payload, { withCredentials: true })
      .then(() => {
        setTutors(tutors.map(t => t.id === editTutorId ? { ...t, name: editTutorData.name } : t));
        setEditTutorId(null);
        setEditTutorData({ name: "", password: "" });
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to update tutor");
      });
  };

  // Remove tutor
  const handleRemoveTutor = (id) => {
    if (!window.confirm("Are you sure you want to remove this tutor?")) return;
    axios.delete(`${API_BASE}/api/users/delete-tutor/${id}`, { withCredentials: true })
      .then(() => {
        setTutors(tutors.filter(t => t.id !== id));
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to delete tutor");
      });
  };

  if (loading) return <p>Loading students...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>User Management</h2>

      {/* Add Student Section */}
      <h3>Add Student</h3>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={newStudent.name}
          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newStudent.password}
          onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
        />
        <button onClick={handleAddStudent} disabled={studentButtonDisabled}>
        {studentButtonDisabled ? "Please wait..." : "Add Student"}
        </button>
      </div>

      {/* Add Tutor Section */}
      <h3>Add Tutor</h3>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={newTutor.name}
          onChange={(e) => setNewTutor({ ...newTutor, name: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newTutor.password}
          onChange={(e) => setNewTutor({ ...newTutor, password: e.target.value })}
        />      
<button onClick={handleAddTutor} disabled={tutorButtonDisabled}>
  {tutorButtonDisabled ? "Please wait..." : "Add Tutor"}
</button>
      </div>

      {/* Tutor List */}
      <h3>Tutor List</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Password (edit only)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tutors.map((tutor) => (
            <tr key={tutor.id}>
              <td>{tutor.id}</td>
              <td>
                {editTutorId === tutor.id ? (
                  <input
                    type="text"
                    value={editTutorData.name}
                    onChange={(e) => setEditTutorData({ ...editTutorData, name: e.target.value })}
                  />
                ) : (
                  tutor.name
                )}
              </td>
              <td>
                {editTutorId === tutor.id ? (
                  <input
                    type="password"
                    placeholder="New password"
                    value={editTutorData.password}
                    onChange={(e) => setEditTutorData({ ...editTutorData, password: e.target.value })}
                  />
                ) : (
                  "••••••"
                )}
              </td>
              <td>
                {editTutorId === tutor.id ? (
                  <>
                    <button onClick={handleSaveEditTutor}>Save</button>
                    <button onClick={() => setEditTutorId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditTutor(tutor)}>Edit</button>
                    <button onClick={() => handleRemoveTutor(tutor.id)}>Remove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Student List */}
      <h3>Student List</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Password (edit only)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>
                {editStudentId === student.id ? (
                  <input
                    type="text"
                    value={editStudentData.name}
                    onChange={(e) => setEditStudentData({ ...editStudentData, name: e.target.value })}
                  />
                ) : (
                  student.name
                )}
              </td>
              <td>
                {editStudentId === student.id ? (
                  <input
                    type="password"
                    placeholder="New password"
                    value={editStudentData.password}
                    onChange={(e) => setEditStudentData({ ...editStudentData, password: e.target.value })}
                  />
                ) : (
                  "••••••"
                )}
              </td>
              <td>
                {editStudentId === student.id ? (
                  <>
                    <button onClick={handleSaveEdit}>Save</button>
                    <button onClick={() => setEditStudentId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditStudent(student)}>Edit</button>
                    <button onClick={() => handleRemoveStudent(student.id)}>Remove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;