import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_URL } from '../api.js';
import "./TutorQuery.css";

function TutorQuery() {
  // ================= STUDENT SELECTION STATES =================
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // State for content domains and competencies
  const [contentDomains, setContentDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [competencyTable, setCompetencyTable] = useState([]);
  const [lockedMastery, setLockedMastery] = useState({}); // To lock estimated mastery values

  // State for manual query results
  const [manualQueryResults, setManualQueryResults] = useState(null);

  // Fetch content domains on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/teacher/domains`).then((res) => {
      setContentDomains(res.data);
    });
  }, []);

  // Fetch competencies for the selected domain
  useEffect(() => {
    if (!selectedDomain) return;

    axios
      .get(`${API_URL}/api/teacher/competencies?domain=${selectedDomain}`)
      .then((res) => {
        const filteredCompetencies = res.data
          .map((comp) => ({
            competency: comp.label,
            estimatedMastery: lockedMastery[comp.label] || "",
            rawScore: "",
            percentage: "",
            actualMastery: "",
          }))
          .reverse(); // Reverse the order of competencies
        setCompetencyTable(filteredCompetencies);
      });
  }, [selectedDomain, lockedMastery]);

  // Handle manual query results and update the table
  useEffect(() => {
    if (!manualQueryResults || !manualQueryResults.mastery_probabilities) return;

    const updatedTable = competencyTable.map((row) => {
      if (manualQueryResults.mastery_probabilities[row.competency] !== undefined) {
        const estimatedMastery =
          lockedMastery[row.competency] ||
          manualQueryResults.mastery_probabilities[row.competency];
        return {
          ...row,
          estimatedMastery,
        };
      }
      return row;
    });

    // Lock the estimated mastery values
    const updatedLockedMastery = { ...lockedMastery };
    Object.keys(manualQueryResults.mastery_probabilities).forEach((comp) => {
      if (!lockedMastery[comp]) {
        updatedLockedMastery[comp] =
          manualQueryResults.mastery_probabilities[comp];
      }
    });

    setCompetencyTable(updatedTable);
    setLockedMastery(updatedLockedMastery);
  }, [manualQueryResults]);

  // Update raw score, percentage, and actual mastery after querying
  useEffect(() => {
    if (!selectedStudent || !selectedDomain) return;

    axios
      .get(`${API_URL}/api/teacher/results/${selectedStudent}`, {
        withCredentials: true,
      })
      .then((res) => {
        const studentResults = res.data;

        const updatedTable = competencyTable.map((row) => {
          const result = studentResults.find(
            (r) => r.examName === row.competency
          );
          if (result) {
            const percentage = ((result.score / result.total) * 100).toFixed(2);
            return {
              ...row,
              rawScore: result.score,
              percentage: `${percentage}%`,
              actualMastery: result.score >= 7, // Pass if score >= 7
            };
          }
          return row;
        });

        setCompetencyTable(updatedTable);
      });
  }, [selectedStudent, selectedDomain, manualQueryResults]);

  // Reset the table
  const handleResetTable = () => {
    setCompetencyTable([]);
    setLockedMastery({});
  };

  return (
    <div className="content-box">
      <h2 className="section-title">Tutor Query</h2>

      {/* New Section: Student Progress Table */}
      <h3>Student Progress: {selectedStudent || "No Student Selected"}</h3>
      <div>
        <label>
          Select Content Domain:
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            <option value="">--Select Domain--</option>
            {contentDomains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleResetTable} style={{ marginLeft: "1rem" }}>
          Reset Table
        </button>
      </div>

      <table className="competency-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Competency/Node</th>
            <th>Estimated Mastery</th>
            <th>Raw Score</th>
            <th>Percentage</th>
            <th>Actual Mastery</th>
          </tr>
        </thead>
        <tbody>
          {competencyTable.map((row, idx) => (
            <tr key={idx}>
              <td>{row.competency}</td>
              <td>{row.estimatedMastery || "-"}</td>
              <td>{row.rawScore || "-"}</td>
              <td>{row.percentage || "-"}</td>
              <td>
                {row.actualMastery ? (
                  <span style={{ color: "green" }}>✔ Pass</span>
                ) : (
                  <span style={{ color: "red" }}>✘ Fail</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TutorQuery;