const API_URL = "https://cap-2416-it-capstone.onrender.com";
// const API_URL = "http://127.0.0.1:5000";

/**
 * 1) List all BIF files
 */
export async function listBifFiles() {
  try {
    const response = await fetch(`${API_URL}/api/biffiles`);
    return await response.json();
  } catch (error) {
    console.error("Error listing BIF files:", error);
    return { bif_files: [] };
  }
}

/**
 * 2) Get competencies for a chosen BIF
 *    GET /api/competencies?bif=filename
 */
export async function getCompetencies(bif) {
  try {
    const response = await fetch(`${API_URL}/api/competencies?bif=${bif}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting competencies:", error);
    throw error;
  }
}

/**
 * 3) Assess tested competencies & scores
 *    POST /api/assess?bif=filename
 *    Body: { "tested": [ { "competency": "...", "score": 5 }, ... ] }
 */
export async function assessCompetencies(bif, tested) {
  try {
    const response = await fetch(`${API_URL}/api/assess?bif=${bif}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tested })
    });
    return await response.json();
  } catch (error) {
    console.error("Error assessing competencies:", error);
    throw error;
  }
}
