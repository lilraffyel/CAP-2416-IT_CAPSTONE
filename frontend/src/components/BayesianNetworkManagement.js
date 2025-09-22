import React, { useState, useEffect } from "react";

function BayesianNetworkManagement() {
  const [networks, setNetworks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // For demonstration, simulate fetching the list of networks.
    const fetchNetworks = async () => {
      // Replace this simulated data with an API call as needed.
      const fetchedNetworks = [
        "comparing.bif",
        "estimate.bif",
        "money.bif",
        "place-value.bif",
        "ordering.bif",
      ];
      setNetworks(fetchedNetworks);
    };

    fetchNetworks();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Call your API endpoint to upload the file.
      setMessage(`Uploaded ${selectedFile.name}`);
      setSelectedFile(null);
    }
  };

  const handleReset = () => {
    // Call your API endpoint to reset the Bayesian Network.
    setMessage("Bayesian Network has been reset to the original state.");
  };

  return (
    <div>
      <h2>Bayesian Network Management</h2>
      <h3>Loaded Networks</h3>
      <ul>
        {networks.map((net, idx) => (
          <li key={idx}>{net}</li>
        ))}
      </ul>

      <h3>Upload New Network</h3>
      <input type="file" accept=".bif" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <h3>Reset Network</h3>
      <button onClick={handleReset}>Reset Network</button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default BayesianNetworkManagement;
