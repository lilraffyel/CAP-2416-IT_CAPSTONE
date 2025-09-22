import React, { useState } from "react";

function Grade3() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    { id: 1, text: "Arrange the following numbers from smallest to largest: 7812, 7128, 7821, 7281", options: ["7812, 7821, 7281, 7128", "7128, 7281, 7812, 7821", "7281, 7128, 7812, 7821", "7821, 7812, 7281, 7128"], correct: "7128, 7281, 7812, 7821" },
    { id: 2, text: "Which of the following lists is arranged from largest to smallest?", options: ["2109, 2901, 2019, 2910", "9876, 9678, 9768, 9867", "5432, 5423, 5342, 5234", "8765, 8657, 8756, 8675"], correct: "5432, 5423, 5342, 5234" },
    { id: 3, text: "John wrote down four numbers: 4578, 4875, 4587, 4857. What is the correct order from smallest to largest?", options: ["4578, 4587, 4857, 4875", "4587, 4578, 4857, 4875", "4875, 4857, 4587, 4578", "4578, 4857, 4587, 4875"], correct: "4578, 4587, 4857, 4875" },
    { id: 4, text: "Arrange 6203, 6032, 6230, 6320 from smallest to largest.", options: ["6203, 6032, 6230, 6320", "6320, 6230, 6203, 6032", "6230, 6032, 6203, 6320", "6032, 6203, 6230, 6320"], correct: "6032, 6203, 6230, 6320" },
    { id: 5, text: "Which of the following is ordered from largest to smallest?", options: ["9121, 9211, 9112, 9011", "3476, 3764, 3647, 3746", "8909, 8901, 8091, 8019", "5678, 5867, 5786, 5768"], correct: "8909, 8901, 8091, 8019" },
    { id: 6, text: "Arrange the numbers 1234, 2134, 1432, 2341 from smallest to largest.", options: ["1234, 2134, 1432, 2341", "2341, 2134, 1432, 1234", "1432, 1234, 2341, 2134", "1234, 1432, 2134, 2341"], correct: "1234, 1432, 2134, 2341" },
    { id: 7, text: "Which sequence is ordered from smallest to largest?", options: ["7909, 7990, 7099, 7909", "5401, 5014, 5104, 5140", "2876, 2678, 2768, 2867", "3129, 3219, 3912, 3921"], correct: "3129, 3219, 3912, 3921" },
    { id: 8, text: "What is the correct order of 9234, 9432, 9243, 9342 from largest to smallest?", options: ["9432, 9342, 9243, 9234", "9234, 9243, 9342, 9432", "9342, 9432, 9243, 9234", "9243, 9234, 9342, 9432"], correct: "9432, 9342, 9243, 9234" },
    { id: 9, text: "Isaac listed four numbers: 8765, 8657, 8756, 8675. Arrange them from smallest to largest.", options: ["8765, 8756, 8675, 8657", "8657, 8675, 8756, 8765", "8756, 8765, 8657, 8675", "8657, 8765, 8675, 8756"], correct: "8657, 8675, 8756, 8765" },
    { id: 10, text: "Which of the following is ordered from smallest to largest?", options: ["4612, 4162, 4621, 4126", "7301, 7103, 7013, 7130", "6019, 6091, 6190, 6910", "5324, 5243, 5342, 5234"], correct: "6019, 6091, 6190, 6910" },
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
      <h1>Grade 3 Assessment(Order numbers up to 10,000 from smallest to largest, and vice versa (Grade 3, QTR 1))</h1>
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

export default Grade3;
