// src/pages/StudentDashboard.js
import React, { useState } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import StudentHome from '../components/student/StudentHome';
import StudentHelpRequest from '../components/student/StudentHelpRequest';
import StudentAssessments from '../components/student/StudentAssessments';
import StudentResults from '../components/student/StudentResults';
import StudentTutorQuery from '../components/student/StudentTutorQuery';

// A custom Link component that checks for navigation blocks
const SafeLink = ({ to, isBlocked, children }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (isBlocked) {
      e.preventDefault();
      if (window.confirm("Are you sure you want to leave? Your progress will be lost.")) {
        navigate(to);
      }
    }
  };

  return <Link to={to} onClick={handleClick}>{children}</Link>;
};


function StudentDashboard() {
  const navigate = useNavigate();
  const [isNavBlocked, setNavBlocked] = useState(false);

  const handleLogout = () => {
    if (isNavBlocked && !window.confirm("Are you sure you want to leave? Your progress will be lost.")) {
      return;
    }
    // Clear user session/token if any
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h3>Student Menu</h3>
        <ul>
          <li><SafeLink to="/student/home" isBlocked={isNavBlocked}>Home</SafeLink></li>
          <li><SafeLink to="/student/help" isBlocked={isNavBlocked}>Request Tutoring</SafeLink></li>
          <li><SafeLink to="/student/assessments" isBlocked={isNavBlocked}>Take Assessments</SafeLink></li>
          <li><SafeLink to="/student/results" isBlocked={isNavBlocked}>View Results</SafeLink></li>
          <li><SafeLink to="/student/tutor-query" isBlocked={isNavBlocked}>Tutor Query</SafeLink></li>
          <li onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <Routes>
          {/* Redirect /student to /student/home by default */}
          <Route path="/" element={<Navigate to="/student/home" replace />} />

          {/* Define available routes */}
          <Route path="home" element={<StudentHome />} />
          <Route path="help" element={<StudentHelpRequest />} />
          <Route path="assessments" element={<StudentAssessments setNavBlocked={setNavBlocked} />} /> {/* Pass setter down */}
          <Route path="results" element={<StudentResults />} />
          <Route path="tutor-query" element={<StudentTutorQuery />} />

          {/* Redirect unknown paths to Home */}
          <Route path="*" element={<Navigate to="/student/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default StudentDashboard;
