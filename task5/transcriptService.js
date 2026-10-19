// transcriptService.js
// Reads transcript JSON, validates it, builds a report and converts it back to JSON.

import Student from './Student.js'; // default import
// named imports, calculateGPA is renamed (aliased) to computeGPA
import { calculateAverage, calculateGPA as computeGPA, calculateGrade } from './gradeUtils.js';

// Step 1: parse safely. JSON.parse throws a SyntaxError for bad text, I wrap it
// in a clearer Error message.
export function parseTranscript(rawData) {
  if (typeof rawData !== 'string') {
    throw new TypeError('Transcript data must be a JSON string');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawData);
  } catch (error) {
    throw new Error(`Malformed JSON: ${error.message}`, { cause: error });
  }

  if (!Array.isArray(parsed)) {
    throw new TypeError('Transcript JSON must be an array of students');
  }
  return parsed;
}

// Step 2: validate every student and turn plain objects into Student objects
export function validateStudents(list) {
  const seenIds = new Set();
  const students = [];

  list.forEach((item, index) => {
    if (item === null || typeof item !== 'object') {
      throw new TypeError(`Record ${index} is not an object`);
    }

    if (item.id === undefined || item.id === null || item.id === '') {
      throw new Error(`Record ${index} has a missing student id`);
    }
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate student id: ${item.id}`);
    }
    seenIds.add(item.id);

    if (!Array.isArray(item.courses)) {
      throw new TypeError(`Student ${item.id}: courses must be an array`);
    }

    item.courses.forEach(course => {
      if (!course || course.code === undefined || course.code === null || String(course.code).trim() === '') {
        throw new Error(`Student ${item.id}: a course has a missing code`);
      }
      if (typeof course.marks !== 'number' || Number.isNaN(course.marks)) {
        throw new TypeError(`Student ${item.id}, ${course.code}: marks must be a number`);
      }
      if (course.marks < 0 || course.marks > 100) {
        throw new RangeError(`Student ${item.id}, ${course.code}: marks ${course.marks} are out of range (0-100)`);
      }
    });

    students.push(new Student(item.id, item.name, item.courses));
  });

  return students;
}

// Step 3: build the report object
export function buildReport(students) {
  const studentReports = students.map(student => {
    const marks = student.getMarks();
    const average = calculateAverage(marks);
    return {
      id: student.id,
      name: student.name,
      courses: student.courses.map(c => ({ code: c.code, marks: c.marks, grade: calculateGrade(c.marks) })),
      average,
      gpa: computeGPA(marks)
    };
  });

  return {
    totalStudents: studentReports.length,
    students: studentReports
  };
}

// Step 4: report object -> JSON text
export function reportToJson(report) {
  return JSON.stringify(report, null, 2);
}

// everything together
export function processTranscript(rawData) {
  const list = parseTranscript(rawData);
  const students = validateStudents(list);
  return buildReport(students);
}
