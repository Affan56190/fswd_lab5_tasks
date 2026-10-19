// main.js - the caller. Run with: node task5/main.js
import Student from './Student.js';
import { processTranscript, reportToJson } from './transcriptService.js';
import { calculateGrade as getGrade, calculateAverage } from './gradeUtils.js'; // alias

// try / catch / finally lives here in the caller
function runCase(title, rawData) {
  console.log(`\n=== ${title} ===`);
  try {
    const report = processTranscript(rawData);
    console.log(reportToJson(report));
  } catch (error) {
    // error.name shows which type of error it was
    console.log(`${error.name}: ${error.message}`);
  } finally {
    console.log(`(finished: ${title})`);
  }
}

const validData = `
[
  {
    "id": 101,
    "name": "Ali",
    "courses": [
      { "code": "CS301", "marks": 81 },
      { "code": "CS302", "marks": 74 }
    ]
  },
  {
    "id": 102,
    "name": "Sara",
    "courses": [
      { "code": "CS301", "marks": 92 },
      { "code": "CS302", "marks": 88 },
      { "code": "CS303", "marks": 45 }
    ]
  }
]
`;

runCase('Valid data', validData);
runCase('Boundary marks 0 and 100', '[{"id":1,"name":"Edge","courses":[{"code":"X1","marks":0},{"code":"X2","marks":100}]}]');
runCase('Student with no courses', '[{"id":2,"name":"Empty","courses":[]}]');

runCase('Malformed JSON', '[{"id": 1, "name": "Broken",,}]');
runCase('Not an array', '{"id": 1}');
runCase('Not a string at all', 12345);
runCase('Missing student id', '[{"name":"NoId","courses":[]}]');
runCase('Duplicate ids', '[{"id":7,"name":"A","courses":[]},{"id":7,"name":"B","courses":[]}]');
runCase('Marks above 100', '[{"id":3,"name":"High","courses":[{"code":"C1","marks":101}]}]');
runCase('Marks below 0', '[{"id":4,"name":"Low","courses":[{"code":"C1","marks":-1}]}]');
runCase('Marks is a string', '[{"id":5,"name":"Text","courses":[{"code":"C1","marks":"90"}]}]');
runCase('Missing course code', '[{"id":6,"name":"NoCode","courses":[{"marks":70}]}]');
runCase('Courses is not an array', '[{"id":8,"name":"Bad","courses":"CS101"}]');

// using the default import (Student) and the aliased import (getGrade) directly
console.log('\n=== Using the imports directly ===');
const temp = new Student(999, 'Temp', [{ code: 'T1', marks: 90 }, { code: 'T2', marks: 70 }]);
const avg = calculateAverage(temp.getMarks());
console.log(`${temp.name} average = ${avg}, grade = ${getGrade(avg)}`);
