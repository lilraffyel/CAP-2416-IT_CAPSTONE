import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TutorLog.css";

const API_BASE = "https://cap-2416-it-capstone.onrender.com";
// const API_BASE = "${API_BASE}";

const defaultNoteEntry = {
  id: null,
  tutor_id: null,
  comment: "",
  materials: "",
  updated_at: null,
  last_updated_by: null,
  last_updated_by_name: null,
  author_id: null,
  author_name: null,
};

const normalizeSingleNote = (entry) => {
  const base = { ...defaultNoteEntry, ...entry };
  const authorId = base.author_id ?? base.last_updated_by ?? base.tutor_id ?? null;
  const authorName = base.author_name ?? base.last_updated_by_name ?? "";

  return {
    ...base,
    author_id: authorId,
    author_name: authorName,
    last_updated_by: authorId,
    last_updated_by_name: authorName,
    comment: (base.comment || "").trim(),
    materials: (base.materials || "").trim(),
  };
};

const buildNoteKey = (entry) => {
  if (!entry) return "";
  if (entry.id != null) return `id:${entry.id}`;
  if (entry.updated_at) {
    return `ts:${entry.updated_at}:${entry.comment ?? ""}`;
  }
  return `fallback:${entry.author_id ?? ""}:${entry.comment ?? ""}:${entry.materials ?? ""}`;
};

const parseNotePayload = (notePayload = {}) => {
  if (!notePayload || typeof notePayload !== "object") {
    return { entries: [], latest: null };
  }

  const lists = [];

  if (Array.isArray(notePayload.entries)) {
    lists.push(notePayload.entries);
  }

  if (Array.isArray(notePayload.history)) {
    lists.push(notePayload.history);
  } else if (notePayload.history && typeof notePayload.history === "object") {
    lists.push(Object.values(notePayload.history));
  }

  const noteMap = new Map();

  const addEntry = (entry) => {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const normalized = normalizeSingleNote(entry);
    const key = buildNoteKey(normalized);
    if (!noteMap.has(key)) {
      noteMap.set(key, normalized);
    }
    return noteMap.get(key) || normalized;
  };

  lists.forEach((list) => {
    list.forEach((entry) => addEntry(entry));
  });

  let latest = null;
  if (notePayload.latest && typeof notePayload.latest === "object") {
    latest = addEntry(notePayload.latest);
  }

  const sortedEntries = Array.from(noteMap.values()).sort((a, b) => {
    const timeA = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;

    const idA = Number.isFinite(a?.id) ? a.id : parseInt(a?.id ?? "0", 10) || 0;
    const idB = Number.isFinite(b?.id) ? b.id : parseInt(b?.id ?? "0", 10) || 0;
    if (idB !== idA) return idB - idA;

    return (b.comment || "").localeCompare(a.comment || "");
  });

  const latestKey = buildNoteKey(latest) || (sortedEntries[0] ? buildNoteKey(sortedEntries[0]) : "");
  const resolvedLatest = latestKey
    ? sortedEntries.find((entry) => buildNoteKey(entry) === latestKey) || latest
    : latest;

  return {
    entries: sortedEntries.map((entry) => ({ ...entry })),
    latest: resolvedLatest ? { ...resolvedLatest } : null,
  };
};

const isSameNoteEntry = (a, b) => {
  if (!a || !b) return false;
  if (a.id != null && b.id != null) {
    return String(a.id) === String(b.id);
  }
  if (a.updated_at && b.updated_at) {
    return a.updated_at === b.updated_at && (a.comment || "") === (b.comment || "");
  }
  return false;
};

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
  const [noteEntries, setNoteEntries] = useState([]);
  const [latestNote, setLatestNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
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
      setNoteEntries([]);
      setLatestNote(null);
      setNoteDraft("");
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
        const parsedNotes = parseNotePayload(r2.data);
        setNoteEntries(parsedNotes.entries);
        setLatestNote(parsedNotes.latest);
        setNoteDraft("");
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
  const entriesToRender = noteEntries.length > 0
    ? noteEntries
    : latestNote
    ? [{ ...defaultNoteEntry, ...latestNote }]
    : [];
  const noteLatest = latestNote || (entriesToRender.length > 0 ? entriesToRender[0] : null);

  const handleSaveNote = async () => {
    if (!tutorId || !selectedStudentId) return;
    if (!noteDraft.trim()) {
      setStatusMessage("Add some details before saving a note entry.");
      return;
    }
    setIsSaving(true);
    setStatusMessage("");
    try {
      const res = await axios.post(
        `${API_BASE}/api/teacher/tutor/${tutorId}/students/${selectedStudentId}/note`,
        { comment: noteDraft },
        { withCredentials: true }
      );
      const parsed = parseNotePayload(res.data);
      setNoteEntries(parsed.entries);
      setLatestNote(parsed.latest);
      setNoteDraft("");
      setStatusMessage("Notes saved successfully.");
    } catch (error) {
      const apiMessage = error?.response?.data?.error;
      setStatusMessage(apiMessage || "Failed to save notes. Please try again.");
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
                  placeholder={
                    noteLatest
                      ? "Add a follow-up note; previous entries remain below for reference."
                      : "Capture your first note for this student."
                  }
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <button onClick={handleSaveNote} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Note Entry"}
                </button>
                {statusMessage && <p style={{ marginTop: "0.75rem", color: "#2d72d9" }}>{statusMessage}</p>}
                <div className="tutor-log-note-history-wrapper">
                  <h4>Saved note history</h4>
                  {entriesToRender.length === 0 ? (
                    <p style={{ color: "#666" }}>No notes recorded yet.</p>
                  ) : (
                    <table className="tutor-log-note-history-table">
                      <thead>
                        <tr>
                          <th>Date saved</th>
                          <th>Tutor</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entriesToRender.map((entry, index) => {
                          const isLatest = noteLatest ? isSameNoteEntry(entry, noteLatest) : index === 0;
                          return (
                            <tr
                              key={entry.id ?? `${entry.updated_at}-${index}`}
                              className={isLatest ? "tutor-log-note-history-latest" : ""}
                            >
                              <td>{formatDate(entry.updated_at)}</td>
                              <td>
                                {entry.author_name || entry.last_updated_by_name || entry.author_id || entry.tutor_id || "Unknown tutor"}
                              </td>
                              <td>
                                <div className="tutor-log-note-text">
                                  {isLatest && <span className="tutor-log-note-badge">Latest</span>}
                                  {entry.comment || "(No comment provided)"}
                                </div>
                                {entry.materials && (
                                  <div className="tutor-log-note-materials">Shared resources: {entry.materials}</div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="tutor-log-note">
                <h3>Teaching Materials</h3>
                <p style={{ marginTop: 0, color: "#555" }}>
                  Upload educational materials only (PDF, DOC, DOCX, PPT, PPTX). Each file must be 20&nbsp;MB or smaller so
                  it can be shared with future tutors and the student.
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
