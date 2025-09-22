// src/components/StudentProgress.js
import React from 'react';
import { STUDENT_MASTERY } from '../../services/fakeDB';

function StudentProgress({ studentId }) {
  // Retrieve the array of mastery data for this student
  const masteryData = STUDENT_MASTERY[studentId] || [];

  return (
    <div style={{ marginTop: '1rem' }}>
      {masteryData.length === 0 ? (
        <p>No mastery data found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Competency</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Mastery (%)</th>
            </tr>
          </thead>
          <tbody>
            {masteryData.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>{m.competency}</td>
                <td style={{ padding: '8px' }}>
                  {(m.mastery * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentProgress;
