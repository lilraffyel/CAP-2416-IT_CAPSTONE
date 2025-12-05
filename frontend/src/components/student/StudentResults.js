import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_URL } from '../../api.js';
import "../TutorQuery.css"; // <-- Import the CSS for styling

// Helper functions for building the hierarchy tree
function buildTree(structure) {
  const nodes = {};
  structure.forEach(item => {
    nodes[item.node] = { ...item, children: [] };
  });
  const roots = [];
  structure.forEach(item => {
    if (item.parents.length === 0) {
      roots.push(nodes[item.node]);
    } else {
      item.parents.forEach(parent => {
        if (nodes[parent]) {
          nodes[parent].children.push(nodes[item.node]);
        }
      });
    }
  });
  return roots;
}

function flattenTree(tree, indent = 0) {
  let result = [];
  tree.forEach(node => {
    result.push({ node: node.node, indent });
    if (node.children.length > 0) {
      const sortedChildren = [...node.children].sort((a, b) => a.node.localeCompare(b.node));
      result = result.concat(flattenTree(sortedChildren, indent + 1));
    }
  });
  return result;
}

// Hardcoded order and indentation for Estimation domain
function getEstimationOrder() {
  return [
    { node: "Estimation", indent: 0 },
    { node: "Multiply_Two_Numbers", indent: 1 },
    { node: "Product_Using_Multiples", indent: 2 },
    { node: "Sum_Difference_Rounding", indent: 2 },
    { node: "Difference_Up_To_4_Digits", indent: 3 },
    { node: "Sum_Up_To_4_Digits", indent: 3 },
    { node: "Quotient_Using_Multiples", indent: 1 },
    { node: "Divide_2_3_Digit_Numbers", indent: 2 },
  ];
}

// Helper: Map short competency keys to table row labels
function getCompetencyKeyMap() {
  return {
    "Estimation": "Estimation",
    "Multiply_Two_Numbers": "Estimate the result of multiplying two numbers where the product is less than 1,000,000",
    "Quotient_Using_Multiples": "Estimate the quotient of 2- to 3-digit numbers divided by 1- to 2-digit numbers, using multiples of 10 or 100 as appropriate",
    "Divide_2_3_Digit_Numbers": "Estimate the quotient when dividing 3- to 4-digit dividends by 1- to 2-digit divisors, by first estimating the dividends and divisors using multiples of 10",
    "Product_Using_Multiples": "Estimate the product of 2- to 3-digit numbers by 1- to 2-digit numbers by estimating the factors using multiples of 10",
    "Sum_Difference_Rounding": "Estimate the sum and difference of two 5- to 6-digit numbers by rounding the addends to the nearest large place value of the numbers",
    "Difference_Up_To_4_Digits": "Estimate the difference of numbers with up to 4 digits",
    "Sum_Up_To_4_Digits": "Estimate the sum of numbers with up to 4 digits"
  };
}


function StudentResults() {
  const [studentId, setStudentId] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filterText, setFilterText] = useState("");
  const [showScoreSortOptions, setShowScoreSortOptions] = useState(false);

  // --- NEW: States for the progress table ---
  const [contentDomains, setContentDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [competencyTable, setCompetencyTable] = useState([]);
  // --- END NEW ---

  useEffect(() => {
    axios
      .get(`${API_URL}/api/students/me`, { withCredentials: true })
      .then((res) => {
        setStudentId(res.data.studentId);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch student data.");
      });
  }, []);

  useEffect(() => {
    if (!studentId) return;
    axios
      .get(`${API_URL}/api/students/results/${studentId}`, { withCredentials: true })
      .then((res) => setResults(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load results.");
      });
  }, [studentId]);

  // --- NEW: Fetch domains for the progress table ---
  useEffect(() => {
    // This should fetch from the teacher or a general domains endpoint if one exists
    axios.get(`${API_URL}/api/teacher/domains`).then((res) => {
      setContentDomains(res.data);
    });
  }, []);

  // --- NEW: Logic to build the progress table ---
  useEffect(() => {
    if (!selectedDomain || !studentId) {
        setCompetencyTable([]);
        return;
    };

    const domainInfo = contentDomains.find(d => d.id === parseInt(selectedDomain));
    if (!domainInfo || domainInfo.name !== "Estimation") {
      setCompetencyTable([]);
      return; // Only handle Estimation for now
    }

    const orderedStructure = getEstimationOrder();
    const keyMap = getCompetencyKeyMap();

    // Fetch saved progress from the backend
    axios.get(`${API_URL}/api/students/student-progress/${studentId}?domain_id=${selectedDomain}`)
      .then(progressRes => {
        const savedProgress = progressRes.data;

        // Fetch the latest assessment results for the student to get raw scores
        axios.get(`${API_URL}/api/students/results/${studentId}`)
          .then(resultsRes => {
            const studentResults = resultsRes.data;
            const assessmentMap = {};
            axios.get(`${API_URL}/api/students/assessments`).then(assessRes => {
                Object.values(assessRes.data).flat().forEach(a => {
                    assessmentMap[a.title] = a.competency_node;
                });

                const latestScores = {};
                studentResults.forEach(result => {
                    const competencyNode = assessmentMap[result.examName];
                    if (competencyNode) {
                        if (!latestScores[competencyNode] || new Date(result.date) > new Date(latestScores[competencyNode].date)) {
                            latestScores[competencyNode] = {
                                score: result.score,
                                total: result.total,
                                date: result.date,
                            };
                        }
                    }
                });

                let tableData = orderedStructure.map(item => {
                    const savedData = savedProgress[item.node] || {};
                    const latestScoreData = latestScores[item.node];
                    const rawScore = latestScoreData ? `${latestScoreData.score}/${latestScoreData.total}` : "";
                    const percentage = latestScoreData ? `${((latestScoreData.score / latestScoreData.total) * 100).toFixed(0)}%` : "";
                    const actualMastery = latestScoreData ? (latestScoreData.score >= 7 ? "✔ Pass" : "❌ Fail") : null;

                    return {
                        node: item.node,
                        label: keyMap[item.node] || item.node,
                        indent: item.indent,
                        estimatedMastery: savedData.estimated_mastery || "",
                        rawScore: rawScore,
                        percentage: percentage,
                        actualMastery: actualMastery,
                    };
                });

                const subCompetencies = tableData.filter(r => r.indent > 0);
                const allSubCompetenciesPassed = subCompetencies.length > 0 && subCompetencies.every(r => r.actualMastery === "✔ Pass");

                const domainRow = {
                    node: domainInfo.name,
                    label: domainInfo.name,
                    isDomainRow: true,
                    indent: -1,
                    actualMastery: allSubCompetenciesPassed ? "✔ Pass" : null,
                };
                tableData.unshift(domainRow);

                setCompetencyTable(tableData);
            });
          });
      })
      .catch(err => {
        console.error("Error fetching progress data:", err);
        setCompetencyTable([]);
      });
  }, [selectedDomain, studentId, contentDomains]);
  // --- END NEW ---


  const handleSort = (key, direction) => {
    if (direction) {
      setSortConfig({ key, direction });
    } else {
      const newDirection = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
      setSortConfig({ key, direction: newDirection });
    }
    setShowScoreSortOptions(false);
  };

  const filteredAndSortedResults = useMemo(() => {
    let sortableResults = [...results];
    if (filterText) {
      sortableResults = sortableResults.filter(r =>
        r.examName.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    sortableResults.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return sortableResults;
  }, [results, sortConfig, filterText]);


  if (error) return <div>Error: {error}</div>;

  return (
    <div className="content-box">
      {/* --- NEW: Student Progress Section --- */}
      <section className="student-progress-section">
        <div className="student-progress-header">
          <div>
            <h3 className="student-progress-title">My Progress</h3>
            <p className="student-progress-subtitle">
              Track your per-competency performance for a selected domain.
            </p>
          </div>
          <div className="student-progress-controls">
            <label className="domain-select-label">
              <span>Content Domain</span>
              <select
                className="domain-select"
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
              >
                <option value="">--Select Domain--</option>
                {contentDomains.map(domain => (
                  <option
                    key={domain.id}
                    value={domain.id}
                    disabled={domain.name !== "Estimation"}
                  >
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {selectedDomain && (
          <div className="student-progress-card">
            <table className="competency-table">
              <thead>
                <tr>
                  <th>Competency / Node</th>
                  <th>Estimated Mastery</th>
                  <th>Actual Score</th>
                  <th>Actual Percentage</th>
                  <th>Actual Mastery</th>
                </tr>
              </thead>
              <tbody>
                {competencyTable.map((row, idx) => {
                  if (row.isDomainRow) {
                    return (
                      <tr key="domain-row" className="domain-title-row">
                        <td className="competency-name" style={{ fontWeight: 'bold' }}>{row.node}</td>
                        <td colSpan="3"></td>
                        <td>
                          {row.actualMastery ? (
                            <span className="mastery-badge pass">{row.actualMastery}</span>
                          ) : (
                            <span className="mastery-badge neutral">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  const percentageNumber = row.percentage ? parseFloat(String(row.percentage).replace("%", "")) : null;
                  const barWidth = percentageNumber ? `${percentageNumber}%` : "0%";
                  const barClass = percentageNumber == null ? "neutral" : percentageNumber >= 70 ? "pass" : "fail";
                  const status = row.actualMastery?.toLowerCase().includes("pass") ? "pass" : row.actualMastery?.toLowerCase().includes("fail") ? "fail" : "neutral";

                  return (
                    <tr key={idx} className="competency-row">
                      <td className="competency-name" style={{ paddingLeft: `${row.indent * 1.5}rem` }}>
                        {row.node}
                        {row.indent === 0 && <span style={{ fontStyle: 'italic', marginLeft: '8px', color: '#aaa' }}>(Diagnostic Test)</span>}
                      </td>
                      <td className="numeric-cell">{row.estimatedMastery || "-"}</td>
                      <td className="numeric-cell">{row.rawScore !== "" ? row.rawScore : "-"}</td>
                      <td>
                        <div className="mastery-cell">
                          <div className="mastery-bar"><div className={`mastery-bar-fill ${barClass}`} style={{ width: barWidth }} /></div>
                          <span className="mastery-label">{row.percentage || "-"}</span>
                        </div>
                      </td>
                      <td>
                        {row.actualMastery ? (
                          <span className={`mastery-badge ${status}`}>{row.actualMastery}</span>
                        ) : (
                          <span className="mastery-badge neutral">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* --- END NEW --- */}

      <h2 style={{ marginTop: '2rem' }}>Assessment History</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span>Sort by:</span>
        <button onClick={() => handleSort('date')}>Date</button>
        <button onClick={() => setShowScoreSortOptions(!showScoreSortOptions)}>Score</button>
        {showScoreSortOptions && (
          <>
            <button onClick={() => handleSort('score', 'ascending')}>Ascending</button>
            <button onClick={() => handleSort('score', 'descending')}>Descending</button>
          </>
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label>Filter by Exam Name: </label>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="e.g. 'Add_Sub'"
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #444" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Exam Name</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedResults.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #333" }}>
              <td style={{ padding: "8px" }}>{new Date(r.date).toLocaleDateString()}</td>
              <td style={{ padding: "8px" }}>{r.examName}</td>
              <td style={{ padding: "8px" }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentResults;
