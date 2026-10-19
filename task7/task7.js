// Task 7 - Promise-Based Multi-Service Registration Engine

// fake data
const students = [
  { id: 101, name: 'Ali', email: 'ali@au.edu.pk', phone: '03001234567', completed: ['CS101', 'CS201'] },
  { id: 102, name: 'Sara', email: 'sara@au.edu.pk', phone: null, completed: ['CS101', 'CS201'] }, // no phone -> SMS will fail
  { id: 103, name: 'Hina', email: 'hina@au.edu.pk', phone: '03111234567', completed: ['CS101'] }
];

const courses = [
  { code: 'CS401', title: 'Machine Learning', prerequisites: ['CS101', 'CS201'], seats: 5 },
  { code: 'CS450', title: 'Deep Learning', prerequisites: ['CS101'], seats: 0 }
];

// ---------- Promise based services ----------
// Each one creates a Promise: resolve(value) on success, reject(error) on failure.

function getStudent(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const student = students.find(s => s.id === id);
      if (student) {
        resolve(student);
      } else {
        reject(new Error(`Student ${id} not found`));
      }
    }, 50);
  });
}

function getCourse(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = courses.find(c => c.code === code);
      if (course) {
        resolve(course);
      } else {
        reject(new Error(`Course ${code} not found`));
      }
    }, 50);
  });
}

// From here the stages pass a context object { student, course } forward,
// that is how data travels from one .then() to the next.
function checkPrerequisites(context) {
  const { student, course } = context;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const missing = course.prerequisites.filter(code => !student.completed.includes(code));
      if (missing.length > 0) {
        reject(new Error(`Prerequisites not completed: ${missing.join(', ')}`));
      } else {
        resolve(context);
      }
    }, 50);
  });
}

function checkSeats(context) {
  const { course } = context;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (course.seats <= 0) {
        reject(new Error(`Course ${course.code} is full`));
      } else {
        resolve(context);
      }
    }, 50);
  });
}

function registerStudent(context) {
  const { student, course } = context;
  return new Promise(resolve => {
    setTimeout(() => {
      course.seats -= 1;
      const confirmation = { studentId: student.id, course: course.code, status: 'REGISTERED' };
      resolve({ ...context, confirmation });
    }, 50);
  });
}

function sendEmail(context) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`Email sent to ${context.student.email}`), 80);
  });
}

function sendSMS(context) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!context.student.phone) {
        reject(new Error(`No phone number for ${context.student.name}`));
      } else {
        resolve(`SMS sent to ${context.student.phone}`);
      }
    }, 60);
  });
}

function writeAuditLog(context) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`Audit: ${context.confirmation.studentId} -> ${context.confirmation.course}`), 40);
  });
}

// ---------- Part A: registration chain ----------
// IMPORTANT: every .then() must RETURN the next promise (or value). If I forget the
// return, the next .then() gets `undefined` and the chain silently breaks.
function registerChain(studentId, courseCode) {
  return getStudent(studentId)
    .then(student => {
      // nested only to keep `student` together with `course`
      return getCourse(courseCode).then(course => {
        return { student, course };
      });
    })
    .then(context => checkPrerequisites(context))
    .then(context => checkSeats(context))
    .then(context => registerStudent(context));
}

// ---------- Part B: post registration services ----------
// Promise.allSettled waits for ALL of them and never rejects, so one failed
// service (like SMS) does not hide the result of the others.
// Promise.all would not be right here, it rejects as soon as one fails.
function runPostServices(context) {
  const names = ['Email', 'SMS', 'Audit'];

  return Promise.allSettled([
    sendEmail(context),
    sendSMS(context),
    writeAuditLog(context)
  ]).then(outcomes => {
    return outcomes.map((outcome, index) => {
      const row = { service: names[index], status: outcome.status };
      if (outcome.status === 'rejected') {
        row.reason = outcome.reason.message;
      }
      return row;
    });
  });
}

function runScenario(studentId, courseCode) {
  console.log(`\n--- Student ${studentId} -> ${courseCode} ---`);

  return registerChain(studentId, courseCode)
    .then(context => {
      console.log('Registered:', context.confirmation);
      return runPostServices(context);
    })
    .then(report => {
      console.log('Post services report:');
      console.log(report);
    })
    .catch(error => {
      // any rejection from any stage jumps straight here
      console.log('Registration failed:', error.message);
    })
    .finally(() => {
      console.log('(request finished)'); // runs for success AND failure
    });
}

// ---------- Part C: two servers ----------
function courseFromServerA(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Server A is down')), 100); // fails fast
  });
}

function courseFromServerB(code) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ code, title: 'Machine Learning', from: 'Server B' }), 300);
  });
}

function courseFromBrokenServerC(code) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Server C is down')), 150);
  });
}

function partC() {
  console.log('\n=== Part C: first SUCCESSFUL result ===');

  return Promise.any([courseFromServerA('CS401'), courseFromServerB('CS401')])
    .then(result => {
      console.log('Promise.any picked:', result);
      // for comparison only, race would give the wrong answer here
      return Promise.race([courseFromServerA('CS401'), courseFromServerB('CS401')])
        .then(r => console.log('Promise.race picked:', r))
        .catch(e => console.log('Promise.race rejected with:', e.message, '(first settled was the failure)'));
    })
    .then(() => {
      // what if every server fails?
      return Promise.any([courseFromServerA('CS401'), courseFromBrokenServerC('CS401')]);
    })
    .catch(error => {
      console.log('All servers failed ->', error.name + ':', error.errors.map(e => e.message).join(' | '));
    });
}

// ---------- run everything one after another ----------
console.log('=== Part A + B: registration scenarios ===');

runScenario(101, 'CS401') // everything works
  .then(() => runScenario(102, 'CS401')) // SMS fails, others fulfilled
  .then(() => runScenario(103, 'CS401')) // prerequisite missing
  .then(() => runScenario(101, 'CS450')) // course full
  .then(() => runScenario(999, 'CS401')) // student missing
  .then(() => runScenario(101, 'CS000')) // course missing
  .then(() => partC())
  .then(() => {
    console.log(`
Why Promise.any for Part C:
We only care about the first server that gives a GOOD answer. Server A failing quickly
should not stop us from using Server B.
- Promise.race returns the first SETTLED promise, even if it is a rejection, so a fast
  failure from Server A would break the whole request.
- Promise.all would wait for both servers and fail if either fails.
- Promise.any ignores rejections until one succeeds, and only rejects (with an
  AggregateError) when every server has failed.`);
  });
