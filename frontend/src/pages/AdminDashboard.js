/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Adjust these paths if your components are elsewhere
import UserManagement from "../components/UserManagement";
import AssessmentManagement from "../components/AssessmentManagement";
import BayesianNetworkManagement from "../components/BayesianNetworkManagement";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("userManagement");
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any session/token here if needed
    navigate("/"); // Redirect to login
  };

  const renderContent = () => {
    switch (activeTab) {
      case "userManagement":
        return <UserManagement />;
      case "assessments":
        return <AssessmentManagement />;
      case "bayesianNetwork":
        return <BayesianNetworkManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-dashboard" style={{ display: "flex", minHeight: "100vh" }}> 
    // Sidebar
      <div
        className="sidebar"
        style={{
          width: "250px",
          background: "#1c1c1c",
          padding: "1rem",
          borderRight: "1px solid #ccc"
        }}
      >
        <h2>Admin Dashboard</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li
            style={{
              cursor: "pointer",
              fontWeight: activeTab === "userManagement" ? "bold" : "normal",
              marginBottom: "1rem",
            }}
            onClick={() => setActiveTab("userManagement")}
          >
            User Management
          </li>
          <li
            style={{
              cursor: "pointer",
              fontWeight: activeTab === "assessments" ? "bold" : "normal",
              marginBottom: "1rem",
            }}
            onClick={() => setActiveTab("assessments")}
          >
            Assessments
          </li>
          <li
            style={{
              cursor: "pointer",
              fontWeight: activeTab === "bayesianNetwork" ? "bold" : "normal",
              marginBottom: "1rem",
            }}
            onClick={() => setActiveTab("bayesianNetwork")}
          >
            Bayesian Network Management
          </li>
          <li
            style={{
              cursor: "pointer",
              fontWeight: "normal",
              marginTop: "2rem",
              marginBottom: "1rem",
            }}
            onClick={handleLogout}
          >
            Logout
          </li>
        </ul>
      </div>

  // Main Content
      <div className="content" style={{ flex: 1, padding: "2rem" }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default AdminDashboard; */


// src/pages/AdminDashboard.js
import React, { useState } from "react";
import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import UserManagement from "../components/UserManagement";
import AssessmentManagement from "../components/AssessmentManagement";
import BayesianNetworkManagement from "../components/BayesianNetworkManagement";
import AssignTutors from "../components/AssignTutors";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/"); // Redirect to login
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3>Admin Menu</h3>
        <ul>
          <li><Link to="/admin/users">User Management</Link></li>
          <li><Link to="/admin/assessments">Assessments</Link></li>
          <li><Link to="/admin/bayesian">Bayesian Network</Link></li>
          <li><Link to="/admin/assign-tutors">Assign Tutors</Link></li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="assessments" element={<AssessmentManagement />} />
          <Route path="bayesian" element={<BayesianNetworkManagement />} />
          <Route path="assign-tutors" element={<AssignTutors />} />
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminDashboard;
