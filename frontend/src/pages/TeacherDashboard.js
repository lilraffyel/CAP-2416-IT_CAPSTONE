// src/pages/TeacherDashboard.js
import React from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';

// Teacher Components
import TeacherHome from '../components/TeacherHome';
import TeacherProgress from '../components/TeacherProgress';
import TeacherEditAssessments from '../components/TeacherEditAssessments';
import TeacherTutorQuery from '../components/TutorQuery';
//import TeacherProfile from '../components/TeacherProfile';
import TeacherBayesOverview from '../components/TeacherBayesOverview';
import TeacherLog from '../components/TutorLog'

function TeacherDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>Teacher Menu</h3>
        <ul>
          <li><Link to="/teacher/home">View Student Competencies</Link></li>
          <li><Link to="/teacher/progress">Assign Student Assessments</Link></li>
          <li><Link to="/teacher/logs">Tutor Logs</Link></li>
          <li><Link to="/teacher/tutor-query">Tutor Query</Link></li>
          <li><Link to="/teacher/edit-assessments">Create Student Assessment</Link></li>
          <li><Link to="/teacher/bayes-overview">Bayesian Network Overview</Link></li>
          {/*<li><Link to="/teacher/profile">Show Profile</Link></li> */}
          
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      <main className="dashboard-content">
        <Routes>
          <Route path="home" element={<TeacherHome />} />
          <Route path="progress" element={<TeacherProgress />} />
          <Route path="logs" element={<TeacherLog/>} />
          <Route path="edit-assessments" element={<TeacherEditAssessments />} />
          <Route path="tutor-query" element={<TeacherTutorQuery />} />
         {/* <Route path="profile" element={<TeacherProfile />} />*/}
          <Route path="bayes-overview" element={<TeacherBayesOverview />} />
          {/* Default route → TeacherHome */}
          <Route path="*" element={<TeacherHome />} />
        </Routes>
      </main>
    </div>
  );
}

export default TeacherDashboard;
