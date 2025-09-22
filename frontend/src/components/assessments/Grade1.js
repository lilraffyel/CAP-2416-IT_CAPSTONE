// src/components/assessments/Grade1.js
import React, { useState } from "react";
import { assessCompetencies } from "../../api";

function Grade1() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  // Example questions
 const questions = [
    { id: 1, text: "Arrange the numbers 5, 12, and 3, from smallest to largest.", options: ["12, 5, 3", "3, 12, 5", "3, 5, 12", "5, 3, 12"], correct: "3, 5, 12" },
    { id: 2, text: "Arrange the numbers 9, 14, and 6, from largest to smallest.", options: ["6, 9, 14", "14, 6, 9", "9, 14, 6", "14, 9, 6"], correct: "14, 9, 6" },
    { id: 3, text: "What is the order of 15, 4, and 11 from smallest to largest?", options: ["4, 11, 15", "11, 4, 15", "4, 15, 11", "15, 11, 4"], correct: "4, 11, 15" },
    { id: 4, text: "What is the order of 12, 17, and 9 from largest to smallest?", options: ["12, 17, 9", "9, 17, 12", "9, 12, 17", "17, 12, 9"], correct: "17, 12, 9" },
    { id: 5, text: "Arrange the numbers 13, 7, 16, and 9 from smallest to largest.", options: ["13, 16, 7, 9", "7, 9, 13, 16", "7, 16, 9, 13", "13, 7, 16, 9"], correct: "7, 9, 13, 16" },
    { id: 6, text: "Arrange the numbers 4, 18, 20, and 9 from largest to smallest.", options: ["4, 9, 20, 18", "20, 18, 9, 4", "20, 9, 4, 18", "18, 9, 4, 20"], correct: "20, 18, 9, 4" },
    { id: 7, text: "What is the order of 15, 2, and 11 from smallest to largest?", options: ["11, 2, 15", "15, 2, 11", "2, 11, 15", "2, 15, 11"], correct: "2, 11, 15" },
    { id: 8, text: "What is the order of 3, 16, 7, and 19 from smallest to largest?", options: ["3, 7, 16, 19", "19, 3, 7, 16", "7, 3, 16, 19", "3, 7, 19, 16"], correct: "3, 7, 16, 19" },
    { id: 9, text: "What is the order of 16, 6, and 12 from largest to smallest?", options: ["6, 16, 12", "16, 6, 12", "12, 16, 6", "16, 12, 6"], correct: "16, 12, 6" },
    { id: 10, text: "Arrange 7, 11, 4, and 20 from smallest to largest.", options: ["20, 11, 7, 4", "4, 7, 11, 20", "7, 4, 20, 11", "11, 4, 7, 20"], correct: "4, 7, 11, 20" }
  ];
  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = async () => {
    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) {
        totalScore++;
      }
    });
    setScore(totalScore);
    setSubmitted(true);

    // We'll treat all 10 questions as a single "competency" test
    const tested = [
      { competency: "Order_Numbers_20", score: totalScore },
    ];

    try {
      // Call the new assess endpoint
      const data = await assessCompetencies(tested);
      if (data.assessment_results) {
        setResults(data.assessment_results);
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
    }
  };

  return (
    <div>
      <h1>Grade 1 Assessment (Ordering up to 20)</h1>
      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.text}</p>
          {q.options.map((option) => (
            <label key={option} style={{ display: "block", marginLeft: "1.5rem" }}>
              <input
                type="radio"
                name={`question-${q.id}`}
                value={option}
                onChange={(e) => handleChange(q.id, e.target.value)}
                disabled={submitted}
              />
              {option}
            </label>
          ))}
        </div>
      ))}

      {!submitted && (
        <button onClick={handleSubmit} style={{ marginTop: "1rem" }}>
          Submit
        </button>
      )}
      {submitted && <h2>Your Score: {score}/{questions.length}</h2>}

      {results.length > 0 && (
        <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
          <h3>Assessment Results:</h3>
          {results.map((r, i) => (
            <p key={i}>
              Competency: {r.competency}, Score: {r.score}, 
              {r.next_focus
                ? ` Next Focus: ${r.next_focus}`
                : " No next focus needed"}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default Grade1;
