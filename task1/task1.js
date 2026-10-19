// Task 1 - Admission Decision and Data Sanitization Engine


const SUPPORTED_PROGRAMS = ['BSCS', 'BSSE', 'BSAI'];

// Weights are kept as whole percentages. I divide by 100 at the end because
// 0.3 * 70 style multiplication can give floating point garbage.
const MATRIC_WEIGHT = 20;
const INTER_WEIGHT = 30;
const TEST_WEIGHT = 50;

// My rule for SELECTED vs WAITING:
// eligible + merit >= 80 + fee paid  -> SELECTED
// eligible but merit is 70-79.99 OR fee not paid -> WAITING
const SELECTED_MERIT = 80;

// Form values come as strings so every number is converted explicitly.
// Problems are pushed into the errors array instead of crashing.
function convertNumber(value, fieldName, errors) {
  // guard clause: undefined, null, "" and "   " all count as missing
  if (value === undefined || value === null || String(value).trim() === '') {
    errors.push(`${fieldName} is missing`);
    return null;
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    errors.push(`${fieldName} is not a valid number ("${value}")`);
    return null;
  }
  return number;
}

function checkMarksRange(number, fieldName, errors) {
  if (number === null) return; // already reported as missing/invalid
  if (number < 0 || number > 100) {
    errors.push(`${fieldName} must be between 0 and 100 (got ${number})`);
  }
}

// switch is used here because there are only 2 valid strings
function convertFeePaid(value, errors) {
  switch (String(value).trim().toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      errors.push(`feePaid must be "true" or "false" (got "${value}")`);
      return null;
  }
}

function checkProgram(program, errors) {
  const cleaned = typeof program === 'string' ? program.trim().toUpperCase() : '';
  if (!SUPPORTED_PROGRAMS.includes(cleaned)) {
    errors.push(`program "${program}" is not supported`);
  }
  return cleaned;
}

function calculateMerit(matric, inter, test) {
  return (matric * MATRIC_WEIGHT + inter * INTER_WEIGHT + test * TEST_WEIGHT) / 100;
}

function decideStatus(merit, entryTest, inter, feePaid) {
  const eligible = merit >= 70 && entryTest >= 60 && inter >= 60;
  if (!eligible) {
    return 'REJECTED';
  }
  // ternary: selected only when merit is high AND the fee is paid
  return merit >= SELECTED_MERIT && feePaid ? 'SELECTED' : 'WAITING';
}

// Handles ONE applicant and always returns a result object (never throws)
function processApplicant(applicant) {
  // guard clause for completely broken records
  if (applicant === null || typeof applicant !== 'object') {
    return {
      id: 'UNKNOWN',
      name: 'UNKNOWN',
      program: null,
      merit: null,
      status: 'INVALID DATA',
      errors: ['applicant record is not an object']
    };
  }

  const errors = [];
  const { id, name } = applicant;

  if (!id) errors.push('id is missing');
  if (typeof name !== 'string' || name.trim() === '') errors.push('name is missing');

  const age = convertNumber(applicant.age, 'age', errors);
  const matric = convertNumber(applicant.matricMarks, 'matricMarks', errors);
  const inter = convertNumber(applicant.intermediateMarks, 'intermediateMarks', errors);
  const entryTest = convertNumber(applicant.entryTest, 'entryTest', errors);

  checkMarksRange(matric, 'matricMarks', errors);
  checkMarksRange(inter, 'intermediateMarks', errors);
  checkMarksRange(entryTest, 'entryTest', errors);

  if (age !== null && (age < 17 || age > 30)) {
    errors.push(`age must be between 17 and 30 (got ${age})`);
  }

  const feePaid = convertFeePaid(applicant.feePaid, errors);
  const program = checkProgram(applicant.program, errors);

  const result = {
    id: id || 'UNKNOWN',
    name: name || 'UNKNOWN',
    program,
    merit: null,
    status: 'INVALID DATA',
    errors
  };

  // validity is checked BEFORE merit is calculated
  if (errors.length > 0) {
    return result;
  }

  result.merit = calculateMerit(matric, inter, entryTest);
  result.status = decideStatus(result.merit, entryTest, inter, feePaid);
  return result;
}

function processAll(applicants) {
  const results = [];
  if (!Array.isArray(applicants)) return results;

  for (const applicant of applicants) {
    results.push(processApplicant(applicant));
  }
  return results;
}

function makeSummary(results) {
  const validResults = [];
  let invalidCount = 0;

  // start every supported program from 0 so they always show up
  const programCounts = {};
  for (const program of SUPPORTED_PROGRAMS) {
    programCounts[program] = 0;
  }
  let otherPrograms = 0;

  for (const result of results) {
    if (result.status === 'INVALID DATA') {
      invalidCount++;
    } else {
      validResults.push(result);
    }

    if (result.program in programCounts) {
      programCounts[result.program]++;
    } else {
      otherPrograms++;
    }
  }

  let highest = null;
  let lowest = null;
  let total = 0;

  for (const result of validResults) {
    total += result.merit;
    if (highest === null || result.merit > highest.merit) highest = result;
    if (lowest === null || result.merit < lowest.merit) lowest = result;
  }

  return {
    validApplicants: validResults.length,
    invalidApplicants: invalidCount,
    highestMerit: highest ? `${highest.name} (${highest.merit})` : 'none',
    lowestMeritAmongValid: lowest ? `${lowest.name} (${lowest.merit})` : 'none',
    averageMerit: validResults.length > 0 ? Number((total / validResults.length).toFixed(2)) : 0,
    applicantsPerProgram: programCounts,
    otherOrUnsupportedPrograms: otherPrograms
  };
}

// ---------------- test data ----------------

const applicants = [
  // the 3 examples from the lab file
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91', intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88', intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76', intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' },

  // boundary cases
  // merit is exactly 70 and entry test exactly 60 -> eligible, but only WAITING
  { id: 'B201', name: 'Boundary Merit', age: '17', matricMarks: '95', intermediateMarks: '70', entryTest: '60', program: 'BSCS', feePaid: 'true' },
  // everything 100, age 30, but fee not paid -> WAITING
  { id: 'B202', name: 'Perfect NoFee', age: '30', matricMarks: '100', intermediateMarks: '100', entryTest: '100', program: 'BSSE', feePaid: 'false' },
  // marks 0 are valid numbers (0 is falsy but must not be treated as missing) -> REJECTED
  { id: 'B203', name: 'Zero Marks', age: '20', matricMarks: '0', intermediateMarks: '0', entryTest: '0', program: 'BSAI', feePaid: 'true' },
  // merit 77.5 but entry test below 60 -> REJECTED
  { id: 'B204', name: 'Low Test', age: '21', matricMarks: '100', intermediateMarks: '100', entryTest: '55', program: 'BSCS', feePaid: 'true' },

  // invalid cases
  { id: 'C301', name: 'Too Old', age: '31', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C302', name: 'Too Young', age: '16', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C303', name: 'Marks Over 100', age: '20', matricMarks: '101', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C304', name: 'Negative Marks', age: '20', matricMarks: '-5', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C305', name: 'Wrong Program', age: '20', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSEE', feePaid: 'true' },
  { id: 'C306', name: 'Bad Fee', age: '20', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'maybe' },
  { name: 'No Id', age: '20', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSCS', feePaid: 'true' },
  { id: 'C307', name: 'Missing Fields', program: 'BSCS' },
  null
];

const results = processAll(applicants);

for (const r of results) {
  const meritText = r.merit === null ? '-' : r.merit;
  console.log(`${String(r.id).padEnd(8)} ${String(r.name).padEnd(16)} merit: ${String(meritText).padEnd(6)} ${r.status}`);
  if (r.errors.length > 0) {
    console.log(`         problems: ${r.errors.join('; ')}`);
  }
}

console.log('\n===== SUMMARY =====');
console.log(makeSummary(results));

// the original data must not be changed (we only read from it)
console.log('\nOriginal first applicant still has string age:', typeof applicants[0].age === 'string');
