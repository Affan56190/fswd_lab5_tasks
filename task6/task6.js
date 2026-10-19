// Task 6 - Legacy Course Registration Service Using Callbacks
// (no Promises and no async/await in this file, only callbacks + setTimeout)

// fake "database"
const students = {
  101: { id: 101, name: 'Ali', completed: ['CS101', 'CS201'], registered: [] },
  102: { id: 102, name: 'Sara', completed: ['CS101'], registered: [] }
};

const courses = {
  CS401: { code: 'CS401', prerequisites: ['CS101', 'CS201'], seats: 2 },
  CS450: { code: 'CS450', prerequisites: ['CS101'], seats: 0 }
};

// Every function below follows the error-first convention: callback(error, value)
// and calls the callback EXACTLY ONCE (the `return` after an error makes sure of it).

// Stage 1
function loadStudent(studentId, callback) {
  setTimeout(() => {
    const student = students[studentId];
    if (!student) {
      callback(new Error(`Student ${studentId} does not exist`));
      return;
    }
    callback(null, student);
  }, 100);
}

// Stage 2
function checkPrerequisites(student, courseCode, callback) {
  setTimeout(() => {
    const course = courses[courseCode];
    if (!course) {
      callback(new Error(`Course ${courseCode} does not exist`));
      return;
    }

    const missing = course.prerequisites.filter(code => !student.completed.includes(code));
    if (missing.length > 0) {
      callback(new Error(`Prerequisite not completed: ${missing.join(', ')}`));
      return;
    }
    callback(null, course);
  }, 100);
}

// Stage 3
function checkSeats(course, callback) {
  setTimeout(() => {
    if (course.seats <= 0) {
      callback(new Error(`Course ${course.code} is full`));
      return;
    }
    callback(null, course);
  }, 100);
}

// Stage 4
function registerCourse(student, course, callback) {
  setTimeout(() => {
    if (student.registered.includes(course.code)) {
      callback(new Error(`Student ${student.id} is already registered in ${course.code}`));
      return;
    }

    course.seats -= 1;
    student.registered.push(course.code);
    callback(null, { studentId: student.id, course: course.code, status: 'REGISTERED' });
  }, 100);
}

// The whole sequence. Each stage only starts inside the callback of the previous one,
// and if any stage gives an error we call done(error) and the rest never run.
function registerForCourse(studentId, courseCode, done) {
  loadStudent(studentId, (studentError, student) => {
    if (studentError) {
      done(studentError);
      return;
    }

    checkPrerequisites(student, courseCode, (prereqError, course) => {
      if (prereqError) {
        done(prereqError);
        return;
      }

      checkSeats(course, (seatError) => {
        if (seatError) {
          done(seatError);
          return;
        }

        registerCourse(student, course, (registerError, confirmation) => {
          if (registerError) {
            done(registerError);
            return;
          }
          done(null, confirmation); // success, everything passed
        });
      });
    });
  });
}

// ---------- tests ----------
const tests = [
  { title: 'Success', studentId: 101, course: 'CS401' },
  { title: 'Already registered (same request again)', studentId: 101, course: 'CS401' },
  { title: 'Student does not exist', studentId: 999, course: 'CS401' },
  { title: 'Prerequisite not completed', studentId: 102, course: 'CS401' },
  { title: 'Course is full', studentId: 102, course: 'CS450' },
  { title: 'Course does not exist', studentId: 101, course: 'CS999' }
];

// tests also have to run one after another, so the next test starts from the callback
function runTest(index) {
  if (index >= tests.length) {
    console.log('\nAll tests finished.');
    console.log('Seats left in CS401:', courses.CS401.seats);
    return;
  }

  const test = tests[index];
  console.log(`\nTest ${index + 1}: ${test.title}`);

  registerForCourse(test.studentId, test.course, (error, result) => {
    if (error) {
      console.log('  FAILED ->', error.message);
    } else {
      console.log('  OK ->', result);
    }
    runTest(index + 1);
  });
}

runTest(0);

/*
Why is this style hard to maintain when there are more operations?

1. Callback nesting: every dependent step goes one level deeper, so with 4 steps the
   code already looks like a pyramid (callback hell). With 10 steps it is very hard to
   read, and adding or removing a step in the middle means re-indenting everything.

2. Error handling is repeated: every single level needs its own
   `if (error) { done(error); return; }`. If I forget one of them (or forget the return),
   the error is ignored or the callback gets called twice and the flow breaks.

3. try/catch cannot be used across the setTimeout boundary, because the callback runs
   later when the original try block is already finished. So errors can only travel
   through the callback arguments, by hand, one level at a time.

4. Steps that do not depend on each other (like sending an email and an SMS) cannot be
   run together easily, we would need extra counters and flags to know when all are done.

This is the reason Promises (Task 7) and async/await (Task 8) were introduced.
*/
