
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentHelpRequest() {
  const [studentId, setStudentId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [domains, setDomains] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch the logged-in student ID from session
    axios.get("http://localhost:5000/api/students/me", { withCredentials: true })
      .then(res => {
        setStudentId(res.data.studentId);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch student data.");
      });

    // Fetch all available content domains
    axios.get("http://localhost:5000/api/students/domains", { withCredentials: true })
      .then(res => setDomains(res.data))
      .catch(err => {
        console.error(err);
        setError("Failed to load content domains.");
      });
  }, []);

  const handleSubmitHelp = () => {
    if (!selectedDomain || !studentId) {
      setError("Missing domain or student ID.");
      return;
    }

    axios.post(
      "http://localhost:5000/api/students/help-request",
      {
        studentId,
        domainId: selectedDomain,
      },
      { withCredentials: true }
    )
      .then(() => {
        setMessage("Help request submitted!");
        setError("");
      })
      .catch(err => {
        console.error(err);
        setError("Failed to submit help request.");
      });
  };

  return (
    <div className="content-box">
      <h2>Request Tutoring Help</h2>
      <p>Select which domain you need help with:</p>
      
      <select
        value={selectedDomain}
        onChange={(e) => setSelectedDomain(e.target.value)}
      >
        <option value="">-- Pick a Domain --</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <button style={{ marginLeft: '1rem' }} onClick={handleSubmitHelp}>
        Request Help
      </button>

      {message && <p style={{ marginTop: '1rem', color: 'green' }}>{message}</p>}
      {error && <p style={{ marginTop: '1rem', color: 'red' }}>{error}</p>}
    </div>
  );
}

export default StudentHelpRequest;



