import React, { useState } from "react";

function Grade1Two() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    { id: 1, text: "Arrange these numbers from smallest to largest: 53, 28, 11, 14, 29.", options: ["14, 11, 28, 53, 29", "14, 11, 28, 29, 53", "11, 14, 29, 28, 53", "11, 14, 28, 29, 53"], correct: "11, 14, 28, 29, 53" },
    { id: 2, text: "Arrange these numbers from largest to smallest: 74, 32, 33, 25, 26.", options: ["74, 32, 33, 26, 25", "74, 33, 32, 26, 25", "74, 33, 32, 25, 26", "74, 32, 33, 25, 26"], correct: "74, 33, 32, 26, 25" },
    { id: 3, text: "Arrange these numbers from smallest to largest: 23, 47, 18, 50, 28.", options: ["47, 50, 23, 28, 18", "18, 28, 23, 47, 50", "18, 23, 28, 47, 50", "23, 18, 28, 50, 47"], correct: "18, 23, 28, 47, 50" },
    { id: 4, text: "Arrange these numbers from largest to smallest: 89, 57, 33, 64, 41.", options: ["89, 57, 64, 41, 33", " 89, 64, 57, 41, 33", "64, 89, 57, 41, 33", "57, 89, 64, 33, 41"], correct: "89, 64, 57, 41, 33" },
    { id: 5, text: "Arrange these numbers from smallest to largest: 35, 43, 28, 16, 67.", options: ["16, 28, 35, 43, 67", "67, 43, 35, 28, 16", "16, 35, 28, 43, 67", "28, 35, 16, 43, 67"], correct: "16, 28, 35, 43, 67" },
    { id: 6, text: "Arrange these numbers from largest to smallest: 24, 89, 36, 93, 31.", options: ["24, 31, 36, 93, 89", "89, 93, 36, 24, 31", "93, 89, 36, 24, 31", "93, 89, 36, 31, 24"], correct: "93, 89, 36, 31, 24" },
    { id: 7, text: "Put these numbers in ascending order: 73, 19, 56, 38, 84", options: ["73, 56, 19, 38, 84", "19, 38, 56, 73, 84", "38, 19, 56, 73, 84", "84, 73, 56, 38, 19"], correct: "19, 38, 56, 73, 84" },
    { id: 8, text: "Put these numbers in descending order: 15, 66, 28, 45, 87", options: ["87, 45, 66, 28, 15", "87, 45, 66, 15, 28", "87, 66, 45, 28, 15", "87, 66, 45, 15, 28"], correct: "87, 66, 45, 28, 15" },
    { id: 9, text: "Put these numbers in ascending order: 40, 13, 39, 56, 25", options: ["13, 25, 39, 40, 56", "13, 39, 25, 40, 56", "13, 25, 39, 56, 40", "25, 13, 56, 40, 39"], correct: "13, 25, 39, 40, 56" },
    { id: 10, text: "Put these numbers in descending order: 85, 49, 77, 60, 91", options: ["91, 85, 77, 60, 49", "49, 60, 77, 85, 91", "60, 49, 77, 91, 85", "77, 60, 49, 85, 91"], correct: "49, 60, 77, 85, 91" },
  ];

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    let totalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) {
        totalScore++;
      }
    });
    setScore(totalScore);
    setSubmitted(true);
  };

  return (
    <div>
      <h1>Grade 1-2 Assessment(Order numbers up to 100 from smallest to largest, and vice versa (Grade 1, QTR 2))</h1>
      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.text}</p>
          {q.options.map((option) => (
            <label key={option}>
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
      {!submitted && <button onClick={handleSubmit}>Submit</button>}
      {submitted && <h2>Your Score: {score}/{questions.length}</h2>}
    </div>
  );
}

export default Grade1Two;
