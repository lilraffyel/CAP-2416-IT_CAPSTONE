import React, { useState } from "react";

function Grade2() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    { id: 1, text: "Arrange the following numbers in ascending order: 45, 23, 67, 12.", options: ["12, 23, 45, 67", "12, 45, 23, 67", "67, 45, 12, 23", "45, 67, 23, 12"], correct: "12, 23, 45, 67" },
    { id: 2, text: "Arrange the following numbers in descending order: 31, 87, 49, 22.", options: ["22, 31, 49, 87", "87, 49, 31, 22", "49, 87, 31, 22", "31, 22, 87, 49"], correct: "87, 49, 31, 22" },
    { id: 3, text: "Which of the following sets of numbers is arranged from smallest to largest?", options: ["50, 10, 30, 40", "10, 20, 30, 40", "40, 50, 20, 30", "30, 20, 10, 50"], correct: "10, 20, 30, 40" },
    { id: 4, text: "Arrange the following numbers from smallest to largest: 345, 789, 123, 501.", options: ["123, 345, 501, 789", "345, 789, 123, 501", "123, 789, 345, 501", "789, 123, 501, 345"], correct: "123, 345, 501, 789" },
    { id: 5, text: "Arrange the following numbers from largest to smallest:  250, 145, 981, 432.", options: ["250, 145, 981, 432", "145, 250, 432, 981", "432, 981, 250, 145", "981, 432, 250, 145"], correct: "981, 432, 250, 145" },
    { id: 6, text: "Which of the following sets of numbers is arranged from smallest to largest?", options: ["500, 150, 800, 700", "150, 500, 700, 800", "700, 800, 150, 500", "800, 700, 500, 150"], correct: "150, 500, 700, 800" },
    { id: 7, text: "Arrange the following numbers in ascending order: 600, 783, 911, 430.", options: ["430, 600, 783, 911", "600, 783, 911, 430", "911, 783, 600, 430", "783, 600, 430, 911"], correct: "430, 600, 783, 911" },
    { id: 8, text: "Arrange the following numbers in descending order: 238, 560, 849, 970.", options: ["849, 970, 560, 238", "238, 560, 970, 849", "970, 849, 560, 238", "560, 238, 970, 849"], correct: "970, 849, 560, 238" },
    { id: 9, text: "Which of the following sets of numbers is arranged from largest to smallest?", options: ["500, 300, 400, 200", "200, 400, 300, 500", "500, 400, 300, 200", "300, 200, 400, 500"], correct: "500, 400, 300, 200" },
    { id: 10, text: "Arrange the following numbers from smallest to largest: 715, 621, 530, 850.", options: ["715, 530, 850, 621", "850, 715, 621, 530", "621, 530, 850, 715", "530, 621, 715, 850"], correct: "530, 621, 715, 850" },
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
      <h1>Grade 2 Assessment(Order numbers up to 1000 from smallest to largest, and vice versa (Grade 2, QTR 1))</h1>
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

export default Grade2;
