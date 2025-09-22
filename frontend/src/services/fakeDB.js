// src/services/fakeDB.js

// Students
export const STUDENTS = [
  { id: 1, name: "Isabella Cruz", flagged: false, assignedAssessment: null },
  { id: 2, name: "Liam Santiago", flagged: false, assignedAssessment: null },
];

// Example pinned questions (teacher pinned them in 'Edit Assessments' page)
export let pinnedQuestions = [];

// Minimal utility to add pinned Q
export function pinQuestion(q) {
  pinnedQuestions.push(q);
}
export function unpinQuestion(qId) {
  pinnedQuestions = pinnedQuestions.filter((q) => q.id !== qId);
}

// Example Help Requests
export let helpRequests = [];

// ADD THIS FUNCTION FOR HELP REQUESTS:
export function addHelpRequest(studentId, competency) {
  helpRequests.push({
    studentId,
    competency,
    date: new Date(),
  });
  console.log("Help request added:", { studentId, competency });
}

// Example domain/competency data
export const DOMAINS = [
  { id: "countingNumeracy", label: "Counting and Numeracy" },
  { id: "comparing", label: "Comparing" },
  { id: "ordering", label: "Ordering" },
  { id: "placeValue", label: "Place Value and Number Representation" },
  { id: "estimation", label: "Estimation" },
  { id: "fractions", label: "Fractions" },
  { id: "money", label: "Money" },
];

export const COMPETENCIES = [
  { id: "Order_Numbers_20", label: "Order up to 20", domain: "Ordering" },
  { id: "Order_Numbers_100", label: "Order up to 100", domain: "Ordering" },
  //{ id: "Add_Sub_Within_100", label: "Add & Subtract Within 100", domain: "Counting and Numeracy" },
  { id: "Compare_Order_Decimal", label: "Compare & Order Decimal", domain: "Ordering" },
  { id: "Order_Numbers_1k", label: "Order up to 1000", domain: "Ordering" },
  { id: "Order_Numbers_10k", label: "Order up to 10000", domain: "Ordering" },
  { id: "Ordering Numbers", label: "Ordering Numbers", domain: "Ordering" },
  // Add more competencies with their respective domains
];

// Teacher “flags” a student
export function flagStudent(studentId, flagged) {
  const stu = STUDENTS.find((s) => s.id === studentId);
  if (stu) {
    stu.flagged = flagged;
  }
}

// Teacher “assigns” an assessment
/* export function assignAssessment(studentId, assessmentId) {
  const stu = STUDENTS.find((s) => s.id === studentId);
  if (stu) {
    stu.assignedAssessment = assessmentId;
  }
} */

  export function assignAssessment(studentId, assessmentId) {
    const stu = STUDENTS.find((s) => s.id === studentId);
    if (stu) {
      stu.assignedAssessment = assessmentId;
      console.log(`✅ Assigned ${assessmentId} to student ID ${studentId}`);
    } else {
      console.error(`❌ Student ID ${studentId} not found!`);
    }
  }

// Some example assigned tasks
export const ASSIGNED_TASKS = [
  {
    studentId: 1,
    competency: "Order_Numbers_20",
    dueDate: "2025-08-01",
    title: "Practice ordering numbers up to 20",
  },
  {
    studentId: 1,
    competency: "Add_Sub_Within_100",
    dueDate: "2025-08-10",
    title: "Quiz on addition/subtraction within 100",
  },
  {
    studentId: 3,
    competency: "Order_Numbers_100",
    dueDate: "2025-08-05",
    title: "Order up to 100 Worksheet",
  },
];

// Basic “mastery scores” to show in StudentProgress
export const STUDENT_MASTERY = {
  1: [
    { competency: "Order_Numbers_20", mastery: 0.9 },
    { competency: "Order_Numbers_100", mastery: 0.5 },
    { competency: "Add_Sub_Within_100", mastery: 0.7 },
  ],
  3: [
    { competency: "Order_Numbers_20", mastery: 0.8 },
    { competency: "Order_Numbers_100", mastery: 0.4 },
  ],
  // etc...
};

