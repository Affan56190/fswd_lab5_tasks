// Task 3 - Safe Student Profile Update Service


const student = {
  id: 101,
  name: 'Ali',
  marks: 0,
  scholarship: false,
  address: {
    city: 'Islamabad',
    sector: 'F-10'
  },
  contact: {
    email: 'ali@university.edu'
  }
};

const update = {
  name: 'Ali Khan',
  address: {
    city: 'Rawalpindi'
  },
  contact: {
    phone: '03001234567'
  }
};

// Copies oldObj and then applies only the fields in newObj that are not undefined.
// I check !== undefined (not a truthy check) so 0, false and '' are still accepted.
function mergeFields(oldObj = {}, newObj = {}) {
  const result = { ...oldObj }; // spread = shallow copy
  for (const key of Object.keys(newObj ?? {})) {
    if (newObj[key] !== undefined) {
      result[key] = newObj[key];
    }
  }
  return result;
}

// The main service. Returns a NEW student object, original stays untouched.
function updateStudent(oldStudent, changes = {}) {
  if (oldStudent === null || typeof oldStudent !== 'object') {
    throw new TypeError('oldStudent must be an object');
  }

  // object rest (...) -> "others" holds every property except address and contact
  // default values (= {}) protect us if address/contact do not exist
  const { address: oldAddress = {}, contact: oldContact = {}, ...oldOthers } = oldStudent;
  const { address: newAddress, contact: newContact, ...newOthers } = changes ?? {};

  // nested objects are merged separately, otherwise the whole address would be replaced
  return {
    ...mergeFields(oldOthers, newOthers),
    address: mergeFields(oldAddress, newAddress),
    contact: mergeFields(oldContact, newContact)
  };
}

// rest parameters: any number of update objects can be applied one after another
function applyManyUpdates(baseStudent, ...changesList) {
  return changesList.reduce((current, changes) => updateStudent(current, changes), baseStudent);
}

// ---------- destructuring demos ----------
function describeStudent(stu) {
  // nested destructuring + renaming (name -> studentName) + default values
  const {
    name: studentName,
    marks = 0,
    address: { city, sector = 'unknown sector' } = {},
    contact: { email, phone = 'no phone given' } = {}
  } = stu;

  // property shorthand: key name is same as variable name
  const summary = { studentName, marks, city, sector, email, phone };
  return summary;
}

function arrayDestructuringDemo() {
  const fields = ['id', 'name', 'marks', 'scholarship'];
  const [first, second, ...remaining] = fields; // array destructuring + rest
  console.log('first:', first, '| second:', second, '| remaining:', remaining);

  // swapping two variables without a temp variable
  let a = 'left';
  let b = 'right';
  [a, b] = [b, a];
  console.log('after swap ->', a, b);
}

// ---------- run ----------
const originalCopy = JSON.stringify(student); // to prove nothing changed later

const updated = updateStudent(student, update);

console.log('--- Updated student ---');
console.log(updated);

console.log('\n--- Original after update (should be unchanged) ---');
console.log(student);
console.log('Original unchanged:', JSON.stringify(student) === originalCopy);

console.log('\n--- Checks from the task ---');
console.log('name changed:', updated.name);
console.log('city changed, sector stays:', updated.address.city, updated.address.sector);
console.log('email stays, phone added:', updated.contact.email, updated.contact.phone);

console.log('\n--- Falsy but valid values must be kept (0, false, "") ---');
const falsyUpdate = updateStudent(student, { marks: 0, scholarship: false, name: '' });
console.log(falsyUpdate.marks, falsyUpdate.scholarship, JSON.stringify(falsyUpdate.name));

const withMarks = updateStudent(student, { marks: 85, scholarship: true });
const backToZero = updateStudent(withMarks, { marks: 0, scholarship: false });
console.log('85 -> 0 gives:', backToZero.marks, '| true -> false gives:', backToZero.scholarship);

// the || mistake vs ?? (nullish coalescing)
const newMarks = 0;
console.log('with || :', newMarks || 50, '(wrong, 0 got replaced)');
console.log('with ?? :', newMarks ?? 50, '(correct, 0 is kept)');

console.log('\n--- Optional chaining ---');
console.log('update?.contact?.phone ->', update?.contact?.phone);
console.log('update?.contact?.fax ->', update?.contact?.fax);
console.log('student.contact?.fax ?? "no fax" ->', student.contact?.fax ?? 'no fax');
console.log('missing deep object ->', student.guardian?.contact?.phone ?? 'no guardian');

console.log('\n--- Missing / empty parts of the update ---');
console.log('empty update:', updateStudent(student, {}));
console.log('undefined update works too:', updateStudent(student).address);
console.log('student without address/contact:', updateStudent({ id: 5, name: 'Test' }, { address: { city: 'Lahore' } }));

console.log('\n--- Destructuring demos ---');
console.log(describeStudent(updated));
console.log(describeStudent({ name: 'Bare Student' })); // defaults get used
arrayDestructuringDemo();

console.log('\n--- Rest parameters: many updates in one call ---');
const final = applyManyUpdates(student, { marks: 60 }, { scholarship: true }, { address: { sector: 'G-9' } });
console.log(final);

console.log('\n--- Spread on arrays ---');
const allKeys = [...Object.keys(student), ...Object.keys(update)];
console.log(allKeys);

try {
  updateStudent(null, update);
} catch (error) {
  console.log('\nInvalid student ->', error.name + ':', error.message);
}

// ---------- Reference challenge ----------
console.log('\n=== Reference challenge ===');
console.log('student === updated ?', student === updated);
console.log('student.address === updated.address ?', student.address === updated.address);
console.log('student.contact === updated.contact ?', student.contact === updated.contact);

console.log(`
Why? Objects are compared by reference (memory location), not by their contents.
- student vs updated: updated is a brand new object created with { ... }, so different.
- address vs address: I merged into a new object, so the updated address is a different
  object. That is why changing the city did not touch the original address.
- contact vs contact: same reason, the contact was also rebuilt.
If I had only written { ...student, name: 'Ali Khan' } the copy would be SHALLOW:
the outer object would be new but updated.address === student.address would be true
(same reference), and changing updated.address.city would also change the original.`);

// a quick proof of the shallow copy problem
const shallow = { ...student };
console.log('Shallow copy address shared with original?', shallow.address === student.address);
