import React, { useState } from 'react';

// A more comprehensive set of math competencies for demonstration
const COMPETENCIES = [
  { name: "Order_Numbers_20", displayName: "Order up to 20" },
  { name: "Order_Numbers_100", displayName: "Order up to 100" },
  { name: "Order_Numbers_1k", displayName: "Order up to 1000" },
  { name: "Order_Numbers_10k", displayName: "Order up to 10,000" },
  { name: "Compare_Order_Decimals", displayName: "Compare & Order Decimals" },
  { name: "Add_Sub_Within_100", displayName: "Add & Subtract Within 100" },
  { name: "Multiply_Divide_Basics", displayName: "Multiplication & Division Basics" },
  { name: "Fractions_Intro", displayName: "Basic Fractions" },
  { name: "Decimal_Fractions", displayName: "Decimal-Fraction Equivalences" },
  // etc...
];

// Sample list of students the teacher can choose from
const STUDENTS = [
  { id: 1, name: "Jane Doe" },
  { id: 2, name: "Mark Roberts" },
  { id: 3, name: "Lucy Smith" }
];

/**
 * Placeholder function to simulate Bayesian inference given
 * the teacher's "evidence" of mastery or not mastery,
 * and which student is selected.
 *
 * In a real system, you'd send 'evidence' and 'selectedStudent' 
 * to your BN inference engine or an API endpoint, and get back 
 * posterior probabilities.
 */
function mockBayesQuery(evidence, selectedStudentId) {
  // For demonstration, let's produce some plausible output 
  // that also depends on the student ID.
  return COMPETENCIES.map((c) => {
    // Start with a baseline mastery probability
    let baseline = 0.5;

    // If the teacher indicated mastery for at least 1 skill, we nudge upward,
    // if "not mastered" for at least 1, we nudge downward.
    const hasMasteredAny = Object.values(evidence).includes(true);
    const hasNotMasteredAny = Object.values(evidence).includes(false);

    if (hasMasteredAny) {
      baseline += 0.2; 
    }
    if (hasNotMasteredAny) {
      baseline -= 0.1;
    }

    // Slight variation based on student ID (e.g., Lucy or Mark might 
    // have different typical baseline).
    if (selectedStudentId === 2) {
      // Mark might have a higher baseline for advanced comps
      baseline += 0.05;
    } else if (selectedStudentId === 3) {
      // Lucy might have slightly lower baseline
      baseline -= 0.05;
    }

    // Keep baseline in [0,1]
    if (baseline < 0) baseline = 0;
    if (baseline > 1) baseline = 1;

    return {
      competency: c.name,
      probability: baseline,
    };
  });
}

function TeacherTutorQuery() {
  // Which student is currently selected
  const [selectedStudent, setSelectedStudent] = useState(null);

  // E.g., { "Order_Numbers_20": true/false, "Add_Sub_Within_100": true/false, etc. }
  const [evidence, setEvidence] = useState({});
  const [results, setResults] = useState([]);

  // Update selected student from dropdown
  const handleStudentChange = (event) => {
    const studentId = parseInt(event.target.value, 10);
    setSelectedStudent(studentId);
    // Optionally reset evidence or results when switching students:
    setEvidence({});
    setResults([]);
  };

  // Toggle mastery states
  const handleEvidenceSelect = (competencyName, masteryValue) => {
    setEvidence((prev) => ({
      ...prev,
      [competencyName]: masteryValue,
    }));
  };

  // Query the BN (mocked)
  const handleComputeProbability = () => {
    // If no student is selected, do nothing or alert user
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    const queryResults = mockBayesQuery(evidence, selectedStudent);
    setResults(queryResults);
  };

  // Helper to show label
  const getMasteryLabel = (compName) => {
    const val = evidence[compName];
    if (val === true) return "✓ Mastered";
    if (val === false) return "✗ Not Mastered";
    return "Unknown";
  };

  return (
    <div className="content-box">
      <h2>Tutor Query</h2>
      <p>
        Select which student you want to evaluate, provide evidence about the student's 
        current mastery, then click <strong>Compute Probability</strong> to see updated 
        mastery likelihoods across all competencies.
      </p>

      {/* STUDENT SELECTION */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem' }}>Select Student:</label>
        <select value={selectedStudent || ""} onChange={handleStudentChange}>
          <option value="">-- Pick Student --</option>
          {STUDENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* EVIDENCE SECTION */}
      {selectedStudent && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Set Evidence for {STUDENTS.find(s => s.id === selectedStudent)?.name}</h3>
          {COMPETENCIES.map((c) => (
            <div key={c.name} style={{ marginBottom: '0.5rem' }}>
              <strong>{c.displayName}:</strong>{" "}
              <button
                style={{
                  marginLeft: '0.5rem',
                  background: evidence[c.name] === true ? '#2980b9' : '#3498db'
                }}
                onClick={() => handleEvidenceSelect(c.name, true)}
              >
                Mastered
              </button>
              <button
                style={{
                  marginLeft: '0.5rem',
                  background: evidence[c.name] === false ? '#c0392b' : '#e74c3c'
                }}
                onClick={() => handleEvidenceSelect(c.name, false)}
              >
                Not Mastered
              </button>
              <button
                style={{ marginLeft: '0.5rem' }}
                onClick={() => handleEvidenceSelect(c.name, undefined)}
              >
                Clear
              </button>
              {"  "}
              <span style={{ marginLeft: '0.8rem', color: '#bbb' }}>
                Current: {getMasteryLabel(c.name)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* COMPUTE PROBABILITIES */}
      <button onClick={handleComputeProbability} style={{ marginBottom: '1rem' }}>
        Compute Probability
      </button>

      {/* RESULTS */}
      {results.length > 0 && (
        <div>
          <h3>Inferred Mastery Probabilities for {STUDENTS.find(s => s.id === selectedStudent)?.name}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Competency</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Mastery Probability</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '8px' }}>{r.competency}</td>
                  <td style={{ padding: '8px' }}>{(r.probability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeacherTutorQuery;
