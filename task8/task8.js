// Task 8 - Concurrent Academic API Aggregator with async/await

// ---------- custom errors so we can tell the failure types apart ----------
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

class NetworkError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

class InvalidJsonError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'InvalidJsonError';
  }
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ---------- fake backend data ----------
const users = [
  { id: 1, name: 'Ali', department: 'CS' },
  { id: 2, name: 'Sara', department: 'CS' },
  { id: 3, name: 'Usman', department: 'SE' },
  { id: 4, name: 'Hina', department: 'AI' },
  { id: 5, name: 'Zoya', department: 'AI' }
];

const courses = [
  { code: 'FSWD', title: 'Full Stack Web Development' },
  { code: 'DAA', title: 'Design and Analysis of Algorithms' },
  { code: 'AI101', title: 'Intro to AI' }
];

const results = [
  { studentId: 1, courseCode: 'FSWD', marks: 82 },
  { studentId: 1, courseCode: 'DAA', marks: 70 },
  { studentId: 2, courseCode: 'FSWD', marks: 91 },
  { studentId: 2, courseCode: 'DAA', marks: 88 },
  { studentId: 3, courseCode: 'FSWD', marks: 47 },
  { studentId: 3, courseCode: 'DAA', marks: 40 },
  { studentId: 4, courseCode: 'FSWD', marks: 73 },
  { studentId: 4, courseCode: 'DAA', marks: 66 },
  { studentId: 5, courseCode: 'FSWD', marks: 91 },
  { studentId: 5, courseCode: 'DAA', marks: 79 }
];

// every fake url has a status, a body and a delay (ms)
const routes = {
  '/users': { status: 200, body: JSON.stringify(users), delay: 300 },
  '/courses': { status: 200, body: JSON.stringify(courses), delay: 200 },
  '/results': { status: 200, body: JSON.stringify(results), delay: 400 },
  '/not-found': { status: 404, body: '{"error":"not found"}', delay: 50 },
  '/server-error': { status: 500, body: '{"error":"server crashed"}', delay: 50 },
  '/network-down': { network: true, delay: 50 },
  '/bad-json': { status: 200, body: '{ this is not json', delay: 50 },
  '/slow': { status: 200, body: '[]', delay: 3000 }
};

// ---------- fake fetch ----------
// A class makes the response object look like a real fetch Response
class FakeResponse {
  constructor(status, body) {
    this.status = status;
    this.ok = status >= 200 && status < 300; // same rule as the real fetch
    this.body = body;
  }

  async json() {
    return JSON.parse(this.body); // throws SyntaxError for bad json -> rejected promise
  }
}

function makeAbortError() {
  return new DOMException('The operation was aborted', 'AbortError');
}

function fakeFetch(url, options = {}) {
  const { signal } = options;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(makeAbortError());
      return;
    }

    const route = routes[url] ?? { status: 404, body: '{"error":"unknown url"}', delay: 50 };

    const timer = setTimeout(() => {
      if (route.network) {
        reject(new TypeError('Failed to fetch')); // real fetch rejects with TypeError on network failure
      } else {
        resolve(new FakeResponse(route.status, route.body));
      }
    }, route.delay);

    // if somebody aborts while we are "waiting", stop the timer and reject
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(makeAbortError());
      }, { once: true });
    }
  });
}

// ---------- getJSON ----------
async function getJSON(url, fetchImplementation, options) {
  let response;

  // 1. call fetch. A rejection here means network failure (or abort)
  try {
    response = await fetchImplementation(url, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error; // leave abort alone, fetchWithTimeout turns it into a TimeoutError
    }
    throw new NetworkError(`Network failure while calling ${url}`, { cause: error });
  }

  // 2 + 3. response.ok is false for 404, 500 etc. fetch does NOT throw for these
  if (!response.ok) {
    throw new HttpError(`HTTP ${response.status} for ${url}`, response.status);
  }

  // 4 + 5. parse the body
  try {
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new InvalidJsonError(`Invalid JSON received from ${url}`, { cause: error });
  }
}

// ---------- timeout ----------
async function fetchWithTimeout(url, milliseconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);

  try {
    return await getJSON(url, fakeFetch, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${milliseconds}ms`);
    }
    throw error; // HTTP / network / json errors are passed on unchanged
  } finally {
    clearTimeout(timer); // runs on success AND on failure, so no timer is left behind
  }
}

// ---------- dashboard ----------
function buildDashboard(userList, courseList, resultList) {
  // average marks of every student
  const studentSummaries = userList.map(user => {
    const marks = resultList.filter(r => r.studentId === user.id).map(r => r.marks);
    const total = marks.reduce((sum, m) => sum + m, 0);
    return { ...user, average: marks.length > 0 ? total / marks.length : 0 };
  });

  const allMarksTotal = resultList.reduce((sum, r) => sum + r.marks, 0);

  const best = studentSummaries.reduce((top, s) => {
    return top === null || s.average > top.average ? s : top;
  }, null);

  // a student is "failed" when the average is below 50
  const failedCount = studentSummaries.filter(s => s.average < 50).length;

  // department wise stats
  const departments = studentSummaries.reduce((acc, s) => {
    if (!acc[s.department]) {
      acc[s.department] = { students: 0, total: 0, failed: 0 };
    }
    acc[s.department].students += 1;
    acc[s.department].total += s.average;
    if (s.average < 50) acc[s.department].failed += 1;
    return acc;
  }, {});

  Object.keys(departments).forEach(dept => {
    departments[dept] = {
      students: departments[dept].students,
      averageMarks: Number((departments[dept].total / departments[dept].students).toFixed(2)),
      failed: departments[dept].failed
    };
  });

  return {
    totalStudents: userList.length,
    totalCourses: courseList.length,
    overallAverageMarks: resultList.length > 0 ? Number((allMarksTotal / resultList.length).toFixed(2)) : 0,
    highestPerformingStudent: best ? `${best.name} (average ${best.average})` : 'none',
    failedStudents: failedCount,
    departmentStats: departments
  };
}

async function loadDashboard() {
  // The 3 calls are independent, so ALL of them are started first and then awaited together.
  // Promise.all returns when the slowest one is done (about 400ms, not 300+200+400).
  const [userList, courseList, resultList] = await Promise.all([
    getJSON('/users', fakeFetch),
    getJSON('/courses', fakeFetch),
    getJSON('/results', fakeFetch)
  ]);

  return buildDashboard(userList, courseList, resultList);
}

// ---------- tests ----------
async function main() {
  console.log('=== Concurrent dashboard ===');
  const start = Date.now();
  const dashboard = await loadDashboard();
  const elapsed = Date.now() - start;
  console.log(dashboard);
  console.log(`Loaded in about ${elapsed}ms (sequential would be about 900ms)`);

  console.log('\n=== getJSON with different failures ===');
  // these run one by one only so the printed output stays in order
  const urls = ['/users', '/not-found', '/server-error', '/network-down', '/bad-json'];
  for (const url of urls) {
    try {
      const data = await getJSON(url, fakeFetch);
      console.log(`${url} -> OK, ${data.length} items`);
    } catch (error) {
      console.log(`${url} -> ${error.name}: ${error.message}`);
    }
  }

  console.log('\n=== fetchWithTimeout ===');
  const timeoutTests = [
    { url: '/users', ms: 1000 }, // fast enough
    { url: '/slow', ms: 500 }, // too slow -> timeout
    { url: '/server-error', ms: 1000 },
    { url: '/network-down', ms: 1000 },
    { url: '/bad-json', ms: 1000 }
  ];
  for (const test of timeoutTests) {
    try {
      const data = await fetchWithTimeout(test.url, test.ms);
      console.log(`${test.url} (limit ${test.ms}ms) -> OK, ${data.length} items`);
    } catch (error) {
      console.log(`${test.url} (limit ${test.ms}ms) -> ${error.name}: ${error.message}`);
    }
  }

  console.log('\n=== Dashboard when one service fails ===');
  try {
    await Promise.all([getJSON('/users', fakeFetch), getJSON('/server-error', fakeFetch)]);
  } catch (error) {
    console.log('Dashboard could not load ->', error.name + ':', error.message);
  }
}

main();
