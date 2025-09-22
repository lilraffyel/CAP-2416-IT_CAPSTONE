import React, { useState, useEffect } from "react";
import axios from "axios";

function UserManagement() {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: "", password: "" });
  const [editStudentId, setEditStudentId] = useState(null);
  const [editStudentData, setEditStudentData] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch students from backend API on mount
  useEffect(() => {
    axios.get("http://localhost:5000/api/users/students", { withCredentials: true })
      .then(res => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch students");
        setLoading(false);
      });
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

    axios.post("http://localhost:5000/api/users/add-student", payload, { withCredentials: true })
      .then(() => {
        setStudents([...students, { id: payload.id, name: payload.name }]);
        setNewStudent({ name: "", password: "" });
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to add student");
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

    axios.put(`http://localhost:5000/api/users/edit-student/${editStudentId}`, payload, { withCredentials: true })
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

    axios.delete(`http://localhost:5000/api/users/delete-student/${id}`, { withCredentials: true })
      .then(() => {
        setStudents(students.filter(s => s.id !== id));
      })
      .catch(err => {
        alert(err.response?.data?.error || "Failed to delete student");
      });
  };

  if (loading) return <p>Loading students...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>User Management</h2>

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
        <button onClick={handleAddStudent}>Add Student</button>
      </div>

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
