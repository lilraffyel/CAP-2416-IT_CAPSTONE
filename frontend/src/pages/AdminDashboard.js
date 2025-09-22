import React, { useState } from "react";
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
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="content" style={{ flex: 1, padding: "2rem" }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default AdminDashboard;
