// gradeUtils.js
// These are NAMED exports, so they are imported with { curly braces }.

function checkMarks(marks) {
  if (typeof marks !== 'number' || Number.isNaN(marks)) {
    throw new TypeError(`Marks must be a number, got ${typeof marks}`);
  }
  if (marks < 0 || marks > 100) {
    throw new RangeError(`Marks must be between 0 and 100, got ${marks}`);
  }
}

// same grading table as Task 2
const gradeTable = [
  { min: 85, grade: 'A', points: 4.0 },
  { min: 80, grade: 'A-', points: 3.67 },
  { min: 75, grade: 'B+', points: 3.33 },
  { min: 70, grade: 'B', points: 3.0 },
  { min: 65, grade: 'B-', points: 2.67 },
  { min: 60, grade: 'C+', points: 2.33 },
  { min: 50, grade: 'C', points: 2.0 },
  { min: 0, grade: 'F', points: 0 }
];

export function calculateGrade(marks) {
  checkMarks(marks);
  return gradeTable.find(row => marks >= row.min).grade;
}

export function calculateGradePoints(marks) {
  checkMarks(marks);
  return gradeTable.find(row => marks >= row.min).points;
}

export function calculateAverage(marksList) {
  if (!Array.isArray(marksList)) {
    throw new TypeError('calculateAverage needs an array');
  }
  if (marksList.length === 0) {
    return 0;
  }
  const total = marksList.reduce((sum, marks) => sum + marks, 0);
  return Math.round((total / marksList.length) * 100) / 100;
}

// GPA = average of the grade points of every course
export function calculateGPA(marksList) {
  if (!Array.isArray(marksList)) {
    throw new TypeError('calculateGPA needs an array');
  }
  if (marksList.length === 0) {
    return 0;
  }
  const points = marksList.map(marks => calculateGradePoints(marks));
  return Math.round((points.reduce((sum, p) => sum + p, 0) / points.length) * 100) / 100;
}
