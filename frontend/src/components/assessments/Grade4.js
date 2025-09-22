import React, { useState } from "react";

function Grade4() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    { id: 1, text: "Which number is the greatest?", options: ["5.67", "5.76", "5.68", "5.69"], correct: "5.76" },
    { id: 2, text: "Which number is the smallest?", options: ["3.45", "3.54", "3.46", "3.44"], correct: "3.44" },
    { id: 3, text: "Arrange the numbers from least to greatest: 7.89, 7.98, 7.87, 7.88", options: ["7.98, 7.89, 7.88, 7.87", "7.87, 7.88, 7.89, 7.98", "7.87, 7.89, 7.88, 7.98", "7.88, 7.87, 7.98, 7.89"], correct: "7.87, 7.88, 7.89, 7.98" },
    { id: 4, text: "Which number is greater than 4.62 but less than 4.71?", options: ["4.60", "4.72", "4.65", "4.75"], correct: "4.65" },
    { id: 5, text: "Which of the following is the correct order from greatest to least?", options: ["6.45, 6.47, 6.42, 6.40", "6.47, 6.45, 6.42, 6.40", "6.42, 6.45, 6.47, 6.40", "6.40, 6.42, 6.45, 6.47"], correct: "6.47, 6.45, 6.42, 6.40" },
    { id: 6, text: "Which number is less than 2.99?", options: ["3.01", "3.00", "2.98", "2.99"], correct: "2.98" },
    { id: 7, text: "Compare 8.75 and 8.57 using <, >, or =.", options: ["8.75 < 8.57", "8.75 = 8.57", "8.75 > 8.57", "8.57 > 8.75"], correct: "8.75 > 8.57" },
    { id: 8, text: "Arrange the following in ascending order: 9.12, 9.21, 9.10, 9.20", options: ["9.21, 9.20, 9.12, 9.10", "9.10, 9.12, 9.20, 9.21", "9.12, 9.10, 9.20, 9.21", "9.20, 9.21, 9.10, 9.12"], correct: "9.10, 9.12, 9.20, 9.21" },
    { id: 9, text: "Which number is the greatest?", options: ["10.01", "10.10", "10.02", "10.09"], correct: "10.10" },
    { id: 10, text: "Which number is between 5.32 and 5.37?", options: ["5.38", "5.30", "5.34", "5.28"], correct: "5.34" },
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
      <h1>Grade 4 Assessment(Compare and order decimal numbers with decimal parts to hundredths (Grade 4, QTR 4))</h1>
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

export default Grade4;
