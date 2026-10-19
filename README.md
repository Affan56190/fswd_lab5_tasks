# CampusFlow - Lab 5 (Advanced JavaScript)

All tasks run in plain Node.js (v16+) with ES modules. No packages needed.

    node task1/task1.js     # Admission engine
    node task2/task2.js     # Academic performance engine
    node task3/task3.js     # Safe profile update + reference challenge
    node task4/task4.js     # Person / Student / FacultyMember, this, call, bind
    node task5/main.js      # Modules + fault tolerant JSON
    node task6/task6.js     # Callback registration
    node task7/task7.js     # Promise registration
    node task8/task8.js     # async/await aggregator

(`npm run task1` ... `npm run task8` also work.)

package.json has `"type": "module"`, which is what lets Node use import/export.

Notes
- Explanations asked in the lab are written as comments / printed text inside each file
  (Task 3 references, Task 4 this/call/bind, Task 6 callback problems, Task 7 Promise.any).
- No closures are used as a technique (no function returns an inner function).
- No DOM, HTML, React, Express, database or external packages.
