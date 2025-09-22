// src/pages/StudentDashboard.js
import React from 'react';
import { Link, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

import StudentHome from '../components/student/StudentHome';
import StudentHelpRequest from '../components/student/StudentHelpRequest';
// import StudentAssessmentList from '../components/StudentAssessmentList'; // ✅ NEW
import StudentAssessments from '../components/student/StudentAssessments';               // ✅ NEW
import StudentResults from '../components/student/StudentResults';
// import StudentProfile from '../components/StudentProfile';
// import NotificationPopups from '../components/NotificationPopups';

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h3>Student Menu</h3>
        <ul>
          <li><Link to="/student/help">Request Tutoring</Link></li>
          <li><Link to="/student/assessments">Take Assessments</Link></li>
          <li><Link to="/student/results">View Results</Link></li>
          {/* <li><Link to="/student/profile">Show Profile</Link></li> */}
          <li onClick={handleLogout}>Logout</li>
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
          {/* <Route path="assessments" element={<StudentAssessmentList />} />  */}
          <Route path="assessments" element={<StudentAssessments />} /> {/* ✅ Replaces old */}
          <Route path="results" element={<StudentResults />} />
          {/* <Route path="profile" element={<StudentProfile />} /> */}

          {/* Redirect unknown paths to Home */}
          <Route path="*" element={<Navigate to="/student/home" replace />} />
        </Routes>
      </main>

      {/* Notification Popups (Persistent across the dashboard) */}
      {/* <NotificationPopups /> */}
    </div>
  );
}

export default StudentDashboard;
