import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TutorLog.css";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "${API_BASE}";

const emptyNote = {
  comment: "",
  materials: "",
  updated_at: null,
  last_updated_by: null,
  last_updated_by_name: null,
};

const normalizeNote = (notePayload = {}) => ({
  ...emptyNote,
  ...((notePayload && typeof notePayload === "object") ? notePayload : {}),
});

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function TutorLog() {
  const [tutorId, setTutorId] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [results, setResults] = useState([]);                // assessment history
  const [note, setNote] = useState(() => normalizeNote());
  const [materials, setMaterials] = useState([]);            // uploaded files list
  const [fileToUpload, setFileToUpload] = useState(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [roleMismatch, setRoleMismatch] = useState(false);

  // who am i
  useEffect(() => {
    setIsLoadingStudents(true);
    axios
      .get(`${API_BASE}/api/me`, { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "Tutor") {
          setRoleMismatch(true);
          return;
        }
        setTutorId(res.data.tutorId);
      })
      .catch(() => setRoleMismatch(true))
      .finally(() => setIsLoadingStudents(false));
  }, []);

  // student list for this tutor
  useEffect(() => {
    if (!tutorId) return;
    setIsLoadingStudents(true);
    axios
      .get(`${API_BASE}/api/teacher/tutor/${tutorId}/students`, { withCredentials: true })
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]))
      .finally(() => setIsLoadingStudents(false));
  }, [tutorId]);

  // details for selected student (history, note, materials)
  useEffect(() => {
    if (!tutorId || !selectedStudentId) {
      setResults([]);
      setNote(normalizeNote());
      setMaterials([]);
      return;
    }
    setIsLoadingDetails(true);

    const base = `${API_BASE}/api/teacher/tutor/${tutorId}/students/${selectedStudentId}`;
    Promise.all([
      axios.get(`${base}/results`, { withCredentials: true }).catch(() => ({ data: [] })),
      axios.get(`${base}/note`, { withCredentials: true }).catch(() => ({ data: null })),
      axios.get(`${base}/materials`, { withCredentials: true }).catch(() => ({ data: [] })),
    ])
      .then(([r1, r2, r3]) => {
        setResults(r1.data || []);
        setNote(normalizeNote(r2.data));
        setMaterials(r3.data || []);
      })
      .finally(() => setIsLoadingDetails(false));
  }, [tutorId, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => s.studentName.toLowerCase().includes(term));
  }, [students, searchTerm]);

  const sortedStudents = useMemo(() => {
    const data = [...filteredStudents];
    switch (sortKey) {
      case "assigned": {
        const g = (d) => (d ? new Date(d).getTime() : 0);
        return data.sort((a, b) => g(b.firstAssignedAt) - g(a.firstAssignedAt));
      }
      case "score": {
        const g = (x) => (x?.averagePercent ?? -1);
        return data.sort((a, b) => g(b) - g(a));
      }
      case "name":
      default:
        return data.sort((a, b) => a.studentName.localeCompare(b.studentName, undefined, { sensitivity: "base" }));
    }
  }, [filteredStudents, sortKey]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.studentId === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const averageDisplay = (v) => (v == null ? "No data yet" : `${v.toFixed(1)}%`);

  const handleSaveNote = async () => {
    if (!tutorId || !selectedStudentId) return;
    setIsSaving(true);
    setStatusMessage("");
    try {
      const res = await axios.post(
        `${API_BASE}/api/teacher/tutor/${tutorId}/students/${selectedStudentId}/note`,
        { comment: note.comment, materials: note.materials },
        { withCredentials: true }
      );
      setNote(
        normalizeNote({
          comment: res.data.comment,
          materials: res.data.materials,
          updated_at: res.data.updated_at,
          last_updated_by: res.data.last_updated_by ?? null,
          last_updated_by_name: res.data.last_updated_by_name ?? null,
        })
      );
      setStatusMessage("Notes saved successfully.");
    } catch {
      setStatusMessage("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!tutorId || !selectedStudentId || !fileToUpload) return;
    const form = new FormData();
    form.append("file", fileToUpload);
    try {
      await axios.post(
        `${API_BASE}/api/teacher/tutor/${tutorId}/students/${selectedStudentId}/materials`,
        form,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setFileToUpload(null);
      // refresh list
      const list = await axios.get(
        `${API_BASE}/api/teacher/tutor/${tutorId}/students/${selectedStudentId}/materials`,
        { withCredentials: true }
      );
      setMaterials(list.data || []);
    } catch (err) {
      alert("Upload failed.");
    }
  };

  if (roleMismatch) return <div className="tutor-log-empty-state">Tutor Log is only available for tutors.</div>;

  return (
    <div className="tutor-log-container">
      <header>
        <h1>Tutor Log</h1>
        <p>
          Review your assigned students, inspect their assessment history, and capture session notes or teaching resources to revisit later.
        </p>
      </header>

      <div className="tutor-log-layout">
        <aside className="tutor-log-sidebar">
          <h3>Your Students</h3>
          <input
            type="text"
            placeholder="Search by student name"
            className="tutor-log-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="tutor-log-sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="name">Sort: Name (A–Z)</option>
            <option value="assigned">Sort: Date Assigned (Newest)</option>
            <option value="score">Sort: Average Score (High → Low)</option>
          </select>

          {isLoadingStudents ? (
            <div>Loading students…</div>
          ) : sortedStudents.length === 0 ? (
            <div>No students assigned yet.</div>
          ) : (
            <ul className="tutor-log-student-list">
              {sortedStudents.map((s) => (
                <li key={s.studentId}>
                  <button
                    className={`tutor-log-student-button ${s.studentId === selectedStudentId ? "active" : ""}`}
                    onClick={() => setSelectedStudentId(s.studentId)}
                  >
                    <strong>{s.studentName}</strong>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>Assigned: {formatDate(s.firstAssignedAt)}</div>
                    <div style={{ fontSize: "0.85rem", color: "#555" }}>Avg. Score: {averageDisplay(s.averagePercent)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="tutor-log-details">
          {!selectedStudentId ? (
            <div className="tutor-log-empty-state">Select a student to view their progress and notes.</div>
          ) : isLoadingDetails ? (
            <div>Loading student details…</div>
          ) : (
            <>
              <h2>{selectedStudent?.studentName}</h2>
              <p>
                Assigned on {formatDate(selectedStudent?.firstAssignedAt)} · Last activity {formatDate(selectedStudent?.lastSubmittedAt)} ·
                Assessments completed: {selectedStudent?.completedAssessments || 0}
              </p>

              <h3>Assessment History</h3>
              {results.length === 0 ? (
                <div className="tutor-log-empty-state">No assessments recorded for this student yet.</div>
              ) : (
                <table className="tutor-log-table">
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Score</th>
                      <th>Attempts</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.result_id}>
                        <td>{r.assessment_name}</td>
                        <td>{r.score} / {r.total}</td>
                        <td>{r.attempt_number}</td>
                        <td>{formatDate(r.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="tutor-log-note">
                <h3>Tutor Notes</h3>
                <textarea
                  rows={4}
                  placeholder="Add observations, next steps, or tutoring highlights"
                  value={note.comment || ""}
                  onChange={(e) => setNote({ ...note, comment: e.target.value })}
                />
                <button onClick={handleSaveNote} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Notes"}
                </button>
                {statusMessage && <p style={{ marginTop: "0.75rem", color: "#2d72d9" }}>{statusMessage}</p>}
                {note.updated_at && (
                  <p style={{ fontSize: "0.85rem", color: "#999" }}>
                    Last updated {formatDate(note.updated_at)}
                    {note.last_updated_by_name ? ` by ${note.last_updated_by_name}` : ""}
                  </p>
                )}
              </div>

              <div className="tutor-log-note">
                <h3>Teaching Materials</h3>
                <p style={{ marginTop: 0, color: "#555" }}>
                  Upload PDFs, Word docs, or text files you shared in this session. Students can download them later.
                </p>
                <form onSubmit={handleUpload}>
                  <input type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} />
                  <button type="submit" disabled={!fileToUpload}>Upload</button>
                </form>
                {materials.length === 0 ? (
                  <p style={{ color: "#666" }}>No files uploaded yet.</p>
                ) : (
                  <ul style={{ marginTop: "0.75rem" }}>
                    {materials.map((m) => (
                      <li key={m.id} style={{ marginBottom: "0.35rem" }}>
                        <a href={`${API_BASE}/api/teacher/tutor/materials/${m.id}/download`} target="_blank" rel="noreferrer">
                          {m.original_filename}
                        </a>{" "}
                        <span style={{ color: "#777", fontSize: "0.9rem" }}>
                          · {formatDate(m.uploaded_at)}
                          {m.uploader_name ? ` · Uploaded by ${m.uploader_name}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
