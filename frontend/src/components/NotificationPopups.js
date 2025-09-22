// src/components/NotificationPopups.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ASSIGNED_TASKS } from '../services/fakeDB';

const CURRENT_STUDENT_ID = 1; // Example: Jane

function NotificationPopups() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  // Filter tasks for the current user
  const tasks = ASSIGNED_TASKS.filter(t => t.studentId === CURRENT_STUDENT_ID);

  // We'll store which tasks have been “dismissed” or completed in local state:
  const [dismissedTasks, setDismissedTasks] = useState([]);

  const remainingTasks = tasks.filter(t => !dismissedTasks.includes(t.title));

  if (!visible || remainingTasks.length === 0) {
    return null; // No popup if none remain or user closed
  }

  // Handler for “Take Assessment” → direct route to e.g. /student/assessments
  // Or you could navigate to a specialized route like /student/assessments/<competencyId>
  const handleTakeAssessment = (task) => {
    // Possibly store the chosen competency in localStorage or pass state
    navigate('/student/assessments'); 
  };

  const handleDismissTask = (taskTitle) => {
    setDismissedTasks([...dismissedTasks, taskTitle]);
  };

  return (
    <div style={popupContainerStyle}>
      <div style={popupHeaderStyle}>
        <strong>New or Upcoming Assignments</strong>
        <button onClick={() => setVisible(false)} style={closeBtnStyle}>
          ×
        </button>
      </div>

      {remainingTasks.map((task, i) => (
        <div key={i} style={popupItemStyle}>
          <p style={{ margin: 0 }}>
            <strong>{task.title}</strong><br />
            Due: {task.dueDate}
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => handleTakeAssessment(task)}>
              Take Assessment
            </button>
            <button
              style={{ marginLeft: '0.5rem', background: '#444' }}
              onClick={() => handleDismissTask(task.title)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Minimal inline styles for demonstration */
const popupContainerStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '250px',
  background: '#222',
  color: '#fff',
  borderRadius: '8px',
  padding: '1rem',
  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
  zIndex: 9999
};

const popupHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem'
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#aaa',
  fontSize: '1.2rem',
  cursor: 'pointer'
};

const popupItemStyle = {
  background: '#333',
  padding: '0.5rem',
  borderRadius: '6px',
  marginBottom: '0.5rem'
};

export default NotificationPopups;
