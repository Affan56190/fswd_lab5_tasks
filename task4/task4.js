// Task 4 - University User Hierarchy and Dynamic this

// constructor: special method that runs automatically when we write `new Person(...)`.
// `new` creates an empty object, sets `this` to it, runs the constructor and returns it.
class Person {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  introduce() {
    return `Hi, I am ${this.name} (${this.email})`;
  }
}

// `extends` makes Student a child of Person (it inherits everything from Person)
class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email); // must call the parent constructor before using `this`
    this.rollNo = rollNo;
    this.marks = marks;
  }

  // method overriding: same name as the parent method, so this one is used for students.
  // super.introduce() reuses the parent version instead of copy pasting it.
  introduce() {
    return `${super.introduce()} - Student, Roll No: ${this.rollNo}`;
  }

  getResult() {
    return this.marks >= 50 ? `${this.name}: PASS (${this.marks})` : `${this.name}: FAIL (${this.marks})`;
  }
}

class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    this.employeeId = employeeId;
    this.department = department;
  }

  introduce() {
    return `${super.introduce()} - Faculty, ID: ${this.employeeId}, Department: ${this.department}`;
  }
}

// ---------- runtime polymorphism ----------
const users = [
  new Student('Ali', 'ali@au.edu.pk', '241894', 82),
  new FacultyMember('Mr. Ayaz Khan', 'ayaz@au.edu.pk', 'E-1001', 'CS'),
  new Student('Sara', 'sara@au.edu.pk', '241895', 45),
  new Person('Visitor', 'visitor@au.edu.pk'),
  new FacultyMember('Dr. Mehdi', 'mehdi@au.edu.pk', 'E-1002', 'AI')
];

console.log('--- Polymorphism: same call, different output ---');
users.forEach(user => console.log(user.introduce()));
// JavaScript looks at the real object at runtime and picks that object's introduce().

console.log('\n--- Student results ---');
users.forEach(user => {
  if (user instanceof Student) {
    console.log(user.getResult());
  }
});

// ---------- instanceof ----------
console.log('\n--- instanceof ---');
const ali = users[0];
const ayaz = users[1];
console.log('ali instanceof Student       :', ali instanceof Student);
console.log('ali instanceof Person        :', ali instanceof Person);
console.log('ali instanceof FacultyMember :', ali instanceof FacultyMember);
console.log('ayaz instanceof FacultyMember:', ayaz instanceof FacultyMember);
console.log('ayaz instanceof Student      :', ayaz instanceof Student);

// ---------- this, call() and bind() ----------
const guest = {
  name: 'Dr. Ahmed',
  email: 'ahmed@example.com'
};

console.log('\n--- call() ---');
// guest is NOT a Person, it has no introduce(). call() runs the Person method
// and sets `this` to guest for that one call.
console.log(Person.prototype.introduce.call(guest));

console.log('\n--- Detached method ---');
const fn = ali.introduce; // we only copy the function, it is no longer attached to ali
try {
  fn(); // called alone, so there is no object before the dot
} catch (error) {
  console.log('fn() failed ->', error.name + ':', error.message);
}
// Why: `this` is decided by HOW a function is called, not where it was written.
// ali.introduce() -> this = ali.   fn() -> this = undefined (classes always run in strict mode,
// in sloppy mode it would be the global object and name would just be undefined).

console.log('\n--- bind() ---');
const safeFn = ali.introduce.bind(ali); // new function with `this` permanently set to ali
console.log(safeFn());

// bind also helps when a method is passed around as a callback
function showResultOf(callback) {
  console.log('callback gave ->', callback());
}
try {
  showResultOf(ali.introduce); // loses `this`
} catch (error) {
  console.log('unbound callback failed ->', error.message);
}
showResultOf(safeFn); // bound version still knows it is ali

console.log('\n--- call() with a Student method on another object ---');
const fakeStudent = { name: 'Temp Guest', email: 'temp@example.com', rollNo: 'TEMP-1' };
// the Student version also uses super.introduce(), which works because the method keeps its home class
console.log(Student.prototype.introduce.call(fakeStudent));
