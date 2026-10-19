// Student.js
// The Student class is the DEFAULT export of this file,
// so other files import it without curly braces.

export default class Student {
  constructor(id, name, courses = []) {
    this.id = id;
    this.name = name;
    this.courses = courses; // array of { code, marks }
  }

  // returns just the marks as a plain array
  getMarks() {
    return this.courses.map(course => course.marks);
  }
}
