import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} />

        {/* Student Dashboard (all child routes handled inside) */}
        <Route path="/student/*" element={<StudentDashboard />} />

        {/* Teacher Dashboard (all child routes handled inside) */}
        <Route path="/teacher/*" element={<TeacherDashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admin/*" element={<AdminDashboard />} />
        
      </Routes>
    </Router>
  );
}

export default App;
