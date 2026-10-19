// Task 2 - Academic Performance Intelligence Engine


const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 }
];

// Grading policy as a table, highest first. find() returns the first row
// where marks >= min, so no long if/else chain is needed.
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

function getGradeInfo(marks) {
  const row = gradeTable.find(item => marks >= item.min);
  return row ?? { grade: 'F', points: 0 }; // for NaN or negative marks
}

// ---------- A. Result processing ----------
// map() gives a NEW array, the original objects are not touched
function processResults(list) {
  return list.map(student => {
    const info = getGradeInfo(student.marks);
    return {
      ...student,
      grade: info.grade,
      status: student.marks >= 50 ? 'Pass' : 'Fail',
      gradePoints: info.points
    };
  });
}

// ---------- B. Ranked merit list ----------
// sort() CHANGES the array it is called on, so I copy it first with [...list]
function rankStudents(list) {
  return [...list].sort((a, b) => {
    if (b.marks !== a.marks) {
      return b.marks - a.marks; // higher marks first
    }
    return a.name.localeCompare(b.name); // same marks -> alphabetical
  });
}

// ---------- C. Department statistics ----------
// reduce() builds the object. A department is added the first time we see it,
// so a new department like "DS" works without changing any code.
function departmentStats(list) {
  const stats = list.reduce((acc, student) => {
    const dept = student.department;
    if (!acc[dept]) {
      acc[dept] = { students: 0, total: 0, highest: student.marks, passed: 0 };
    }
    acc[dept].students += 1;
    acc[dept].total += student.marks;
    acc[dept].highest = Math.max(acc[dept].highest, student.marks);
    if (student.marks >= 50) {
      acc[dept].passed += 1;
    }
    return acc;
  }, {});

  // turn total into average and remove the helper field
  Object.keys(stats).forEach(dept => {
    stats[dept].average = Number((stats[dept].total / stats[dept].students).toFixed(2));
    delete stats[dept].total;
  });

  return stats;
}

// ---------- D. Academic queries ----------
function runQueries(list) {
  const ranked = rankStudents(list);
  const average = list.reduce((sum, s) => sum + s.marks, 0) / list.length;

  return {
    firstAbove85: list.find(s => s.marks > 85),
    firstFailedIndex: list.findIndex(s => s.marks < 50),
    anyoneFailed: list.some(s => s.marks < 50),
    allMarksValid: list.every(s => s.marks >= 0 && s.marks <= 100),
    overallAverage: Number(average.toFixed(2)),
    aboveAverage: list.filter(s => s.marks > average).map(s => s.name),
    topThree: ranked.slice(0, 3).map(s => s.name)
  };
}

// ---------------- running everything ----------------
const before = JSON.stringify(results);

console.log('--- A. Processed results ---');
const processed = processResults(results);
processed.forEach(s => {
  console.log(`${s.name.padEnd(6)} ${s.department.padEnd(3)} ${s.marks}  ${s.grade.padEnd(3)} ${s.status}  GP: ${s.gradePoints}`);
});

console.log('\n--- B. Ranked merit list ---');
const ranked = rankStudents(results);
ranked.forEach((s, index) => console.log(`${index + 1}. ${s.name} (${s.marks})`));
console.log('Original order still:', results.map(s => s.name).join(', '));

console.log('\n--- C. Department statistics ---');
console.log(departmentStats(results));

console.log('\n--- D. Queries ---');
console.log(runQueries(results));

// A brand new department must also work
console.log('\n--- New department "DS" appears later ---');
const moreResults = [...results, { id: 7, name: 'Bilal', department: 'DS', course: 'FSWD', marks: 88 }];
console.log(departmentStats(moreResults).DS);

// invalid marks test
console.log('\n--- Invalid marks test ---');
const badList = [...results, { id: 8, name: 'Test', department: 'CS', course: 'FSWD', marks: 120 }];
console.log('every marks valid?', badList.every(s => s.marks >= 0 && s.marks <= 100));

// empty array shouldn't crash the stats
console.log('Stats of empty list:', departmentStats([]));

console.log('\nOriginal array unchanged:', before === JSON.stringify(results));
