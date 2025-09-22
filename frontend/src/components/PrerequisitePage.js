// src/components/PrerequisitePage.js
import React, { useState, useEffect } from 'react';
import { listBIFs, getCompetencies, determineFocus } from '../api';

function PrerequisitePage() {
  const [bifFiles, setBifFiles] = useState({});
  const [selectedBif, setSelectedBif] = useState('');
  const [competencies, setCompetencies] = useState([]);
  const [failedComp, setFailedComp] = useState('');
  const [nextFocus, setNextFocus] = useState(null);

  useEffect(() => {
    // On mount, fetch the list of BIFs
    listBIFs().then((files) => {
      setBifFiles(files);
    });
  }, []);

  const handleBifSelect = async (bifKey) => {
    setSelectedBif(bifKey);
    const comps = await getCompetencies(bifKey);
    setCompetencies(comps);
    setNextFocus(null);
  };

  const handleDetermineFocus = async () => {
    if (!selectedBif || !failedComp) return;
    const nf = await determineFocus(selectedBif, failedComp);
    setNextFocus(nf);
  };

  return (
    <div style={{ margin: '1rem' }}>
      <h2>Prerequisite BN Page</h2>
      <p>Select a BIF file, see competencies, then input a "failed" competency to get next focus.</p>

      <div>
        <h3>1) Select a BIF File</h3>
        {Object.keys(bifFiles).length === 0 ? (
          <p>Loading BIF list...</p>
        ) : (
          <ul>
            {Object.entries(bifFiles).map(([key, fileName]) => (
              <li key={key}>
                <button onClick={() => handleBifSelect(key)}>
                  {key}: {fileName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedBif && (
        <div>
          <h3>2) Competencies for BIF {selectedBif}</h3>
          {competencies.length === 0 ? (
            <p>No competencies yet or loading...</p>
          ) : (
            <ul>
              {competencies.map((comp, idx) => (
                <li key={idx}>{comp}</li>
              ))}
            </ul>
          )}

          <h3>3) Determine Next Focus</h3>
          <p>Pick a "failedCompetency" from the above list:</p>
          <input
            type="text"
            placeholder="e.g. Compare_Up_To_1000"
            value={failedComp}
            onChange={(e) => setFailedComp(e.target.value)}
          />
          <button onClick={handleDetermineFocus}>Find Next Focus</button>

          {nextFocus && (
            <p>
              Next focus for <strong>{failedComp}</strong> is{' '}
              <strong>{nextFocus}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PrerequisitePage;
