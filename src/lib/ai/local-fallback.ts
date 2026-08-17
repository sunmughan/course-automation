/**
 * Local AI Fallback Provider
 *
 * Generates educational responses from course curriculum data when
 * all external AI providers fail (quota exhausted, API keys invalid, etc.).
 * Ensures the AI Tutor always provides helpful responses.
 */

import type { ProviderCallResult } from "./gateway";
import type { TutorMode } from "@/types";

// ─── Topic Knowledge Base ───────────────────────────────────────────────────

interface TopicKnowledge {
  title: string;
  keywords: string[];
  explanation: string;
  codeExample?: string;
  keyPoints: string[];
  commonMistakes?: string[];
  bestPractices?: string[];
  relatedTopics?: string[];
}

const KNOWLEDGE_BASE: TopicKnowledge[] = [
  {
    title: "What is Node.js",
    keywords: ["node.js", "nodejs", "node", "what is node", "introduction", "runtime"],
    explanation:
      "Node.js is a JavaScript runtime built on Chrome's V8 engine. It allows you to run JavaScript on the server side, outside of the browser. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications.",
    keyPoints: [
      "Built on Chrome's V8 JavaScript engine",
      "Server-side JavaScript runtime",
      "Event-driven, non-blocking I/O model",
      "Single-threaded with event loop for concurrency",
      "npm is the world's largest software registry",
      "Used by Netflix, PayPal, LinkedIn, Uber, and more",
    ],
    codeExample: `// Simple Node.js HTTP Server
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Node.js!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});`,
    bestPractices: [
      "Use const/let instead of var",
      "Always handle errors in callbacks",
      "Use async/await for cleaner async code",
    ],
    relatedTopics: ["Event Loop", "V8 Engine", "npm", "Modules"],
  },
  {
    title: "Event Loop",
    keywords: ["event loop", "event-loop", "async", "non-blocking", "callback queue", "call stack", "libuv"],
    explanation:
      "The Event Loop is the heart of Node.js. It's a mechanism that allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded. The event loop continuously checks the call stack and callback queues, executing callbacks when the stack is empty.",
    keyPoints: [
      "Node.js is single-threaded but uses event loop for concurrency",
      "6 phases: timers → pending callbacks → idle/prepare → poll → check → close callbacks",
      "Call Stack: Where function execution happens (LIFO)",
      "Callback Queue: Where completed async operations wait",
      "Microtask Queue (process.nextTick, Promises) runs between phases",
      "process.nextTick() has priority over Promise.then()",
    ],
    codeExample: `// Event Loop Demo
console.log('1: Start');

setTimeout(() => console.log('2: setTimeout'), 0);

Promise.resolve().then(() => console.log('3: Promise'));

process.nextTick(() => console.log('4: nextTick'));

console.log('5: End');

// Output Order: 1: Start → 5: End → 4: nextTick → 3: Promise → 2: setTimeout`,
    commonMistakes: [
      "Blocking the event loop with heavy synchronous computation",
      "Not understanding that setTimeout(fn, 0) is not immediate",
      "Confusing microtask queue with macrotask queue",
    ],
    relatedTopics: ["Callbacks", "Promises", "Async/Await", "libuv"],
  },
  {
    title: "Modules in Node.js",
    keywords: ["module", "modules", "require", "exports", "module.exports", "import", "export", "commonjs", "esm", "es modules"],
    explanation:
      "Node.js uses a module system to organize code into reusable pieces. CommonJS (require/module.exports) is the traditional module system. ES Modules (import/export) is the modern standard. Each file in Node.js is treated as a separate module.",
    keyPoints: [
      "CommonJS: require() to import, module.exports to export",
      "ES Modules: import/export syntax (use .mjs or type:'module')",
      "Node.js wraps each module in a function wrapper",
      "Modules are cached after first load",
      "Core modules (fs, http, path) don't need installation",
      "Third-party modules installed via npm",
    ],
    codeExample: `// ── CommonJS ──
// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// app.js
const { add } = require('./math');
console.log(add(5, 3)); // 8

// ── ES Modules ──
// math.mjs
export function multiply(a, b) { return a * b; }
export default function divide(a, b) { return a / b; }

// app.mjs
import divide, { multiply } from './math.mjs';
console.log(multiply(4, 5)); // 20`,
    bestPractices: [
      "Prefer ES Modules for new projects",
      "Use named exports over default exports",
      "Keep modules focused — one responsibility per module",
    ],
    relatedTopics: ["npm", "package.json", "CommonJS vs ESM"],
  },
  {
    title: "File System (fs)",
    keywords: ["fs", "file system", "filesystem", "read file", "write file", "readfile", "writefile", "stream"],
    explanation:
      "The fs (File System) module provides an API for interacting with the file system. It supports both synchronous and asynchronous operations. The promise-based API (fs/promises) is recommended for modern code.",
    keyPoints: [
      "fs.readFile() / fs.readFileSync() — Read files",
      "fs.writeFile() / fs.writeFileSync() — Write files",
      "fs.appendFile() — Append to files",
      "fs.mkdir() / fs.rmdir() — Create/remove directories",
      "fs/promises — Promise-based API (recommended)",
      "fs.createReadStream() — Stream-based file I/O for large files",
    ],
    codeExample: `const fs = require('fs/promises');

async function readFile() {
  const data = await fs.readFile('hello.txt', 'utf-8');
  console.log(data);
}

async function writeFile() {
  await fs.writeFile('output.txt', 'Hello World!');
  console.log('File written successfully');
}

async function listDir() {
  const files = await fs.readdir('.');
  console.log('Files:', files);
}`,
    commonMistakes: [
      "Using sync methods in production (blocks event loop)",
      "Not handling ENOENT (file not found) errors",
      "Not closing file handles / streams properly",
    ],
    relatedTopics: ["Streams", "Buffers", "Path module"],
  },
  {
    title: "HTTP and Express.js",
    keywords: ["http", "express", "expressjs", "server", "api", "rest", "middleware", "route", "router", "request", "response"],
    explanation:
      "Express.js is the most popular Node.js web framework. It provides a thin layer of fundamental web application features. Express uses middleware functions that have access to the request object, response object, and the next middleware function.",
    keyPoints: [
      "Express is a minimal, unopinionated web framework",
      "Middleware: Functions that execute during request-response cycle",
      "Routing: app.get(), app.post(), app.put(), app.delete()",
      "Request object (req): req.params, req.query, req.body",
      "Response object (res): res.json(), res.send(), res.status()",
      "Error handling middleware: (err, req, res, next) => {}",
    ],
    codeExample: `const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Alice' });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: 3, name, email });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(3000, () => console.log('Server on port 3000'));`,
    bestPractices: [
      "Always validate request body and params",
      "Use helmet middleware for security headers",
      "Structure routes in separate router files",
    ],
    relatedTopics: ["Middleware", "REST API", "Authentication"],
  },
  {
    title: "Async/Await and Promises",
    keywords: ["async", "await", "promise", "promises", "then", "catch", "async/await", "callback", "callback hell"],
    explanation:
      "Promises represent the eventual completion (or failure) of an asynchronous operation. async/await is syntactic sugar over Promises that makes async code look synchronous.",
    keyPoints: [
      "Promise states: pending → fulfilled OR rejected",
      "Promise.all() — Wait for ALL promises",
      "Promise.allSettled() — Wait for ALL, never fails",
      "Promise.race() — First to settle wins",
      "async function always returns a Promise",
      "await pauses until Promise settles",
      "try/catch works with async/await",
    ],
    codeExample: `// Callback Hell (Bad)
getUser(id, (user) => {
  getOrders(user.id, (orders) => {
    getDetails(orders[0].id, (details) => {
      console.log(details);
    });
  });
});

// Async/Await (Best)
async function getFullOrder(id) {
  try {
    const user = await getUser(id);
    const orders = await getOrders(user.id);
    const details = await getDetails(orders[0].id);
    console.log(details);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Parallel execution
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);`,
    commonMistakes: [
      "Forgetting to await a Promise",
      "Using await inside forEach (use for...of instead)",
      "Not catching errors with try/catch",
    ],
    relatedTopics: ["Event Loop", "Error Handling", "Callbacks"],
  },
  {
    title: "Streams and Buffers",
    keywords: ["stream", "streams", "buffer", "buffers", "readable", "writable", "pipe", "transform"],
    explanation:
      "Streams are collections of data that might not be available all at once. They let you read/write data piece by piece. Buffers represent fixed-length sequences of bytes.",
    keyPoints: [
      "4 types: Readable, Writable, Duplex, Transform",
      "stream.pipe(destination) — Connect readable to writable",
      "Streams emit events: data, end, error, finish",
      "Buffer.from() — Create buffer from string/array",
      "Streams process data in chunks — memory efficient",
    ],
    codeExample: `const fs = require('fs');
const { Transform } = require('stream');

const readStream = fs.createReadStream('bigfile.txt', 'utf-8');
const writeStream = fs.createWriteStream('output.txt');

// Pipe: Connect readable to writable
readStream.pipe(writeStream);

// Transform Stream
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

fs.createReadStream('input.txt')
  .pipe(upperCase)
  .pipe(fs.createWriteStream('output.txt'));`,
    relatedTopics: ["File System", "HTTP", "Compression"],
  },
  {
    title: "Error Handling",
    keywords: ["error", "errors", "error handling", "try catch", "throw", "exception"],
    explanation:
      "Proper error handling is critical in Node.js. Unhandled errors crash the process. Node.js has different patterns for synchronous (try/catch), callbacks (error-first), and async (try/catch with await).",
    keyPoints: [
      "Error-first callback pattern: callback(err, result)",
      "try/catch for synchronous and async/await code",
      "Promise.catch() for promise chains",
      "process.on('uncaughtException') — Last resort",
      "Custom error classes for specific error types",
      "Operational errors vs. Programmer errors",
    ],
    codeExample: `class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new AppError('API Error', response.status);
    return await response.json();
  } catch (error) {
    if (error.isOperational) {
      console.log('Expected:', error.message);
    } else {
      throw error; // Re-throw unexpected errors
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err);
  process.exit(1);
});`,
    relatedTopics: ["Debugging", "Logging", "Process"],
  },
  {
    title: "NPM and Package Management",
    keywords: ["npm", "package", "package.json", "node_modules", "install", "dependencies"],
    explanation:
      "npm (Node Package Manager) is the default package manager for Node.js. package.json is the manifest file that holds project metadata, dependencies, and scripts.",
    keyPoints: [
      "npm init — Initialize a new project",
      "npm install <pkg> — Install a dependency",
      "npm install <pkg> --save-dev — Dev dependency",
      "npm run <script> — Run a script",
      "package-lock.json — Locks exact versions",
      "Semantic versioning: ^1.2.3, ~1.2.3, 1.2.3",
    ],
    codeExample: `// package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}`,
    relatedTopics: ["Modules", "Semantic Versioning", "npx"],
  },
  {
    title: "Database and MongoDB",
    keywords: ["database", "mongodb", "mongoose", "schema", "model", "crud", "nosql", "sql", "prisma"],
    explanation:
      "Databases store persistent data for your application. MongoDB is a popular NoSQL document database. Mongoose is an ODM library for MongoDB.",
    keyPoints: [
      "MongoDB stores data as JSON-like documents",
      "Mongoose provides schema validation and middleware",
      "CRUD: Create, Read, Update, Delete",
      "Schema defines document structure",
      "Model provides query interface",
      "Indexing improves query performance",
    ],
    codeExample: `const mongoose = require('mongoose');
await mongoose.connect('mongodb://localhost:27017/myapp');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

const User = mongoose.model('User', userSchema);

// Create
const user = await User.create({ name: 'Alice', email: 'alice@test.com' });
// Read
const allUsers = await User.find();
// Update
await User.findByIdAndUpdate(user._id, { role: 'admin' });
// Delete
await User.findByIdAndDelete(user._id);`,
    relatedTopics: ["REST API", "Authentication", "Data Validation"],
  },
  {
    title: "Authentication and JWT",
    keywords: ["auth", "authentication", "jwt", "json web token", "bcrypt", "password", "login"],
    explanation:
      "Authentication verifies WHO the user is. JWT (JSON Web Token) is a stateless authentication mechanism where the server signs a token and the client sends it with each request.",
    keyPoints: [
      "Authentication = Identity verification",
      "Authorization = Permission checking",
      "JWT has 3 parts: Header.Payload.Signature",
      "bcrypt for password hashing",
      "Store JWT in httpOnly cookies for security",
      "Refresh tokens for extending sessions",
    ],
    codeExample: `const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid password');
  
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return { user, token };
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}`,
    relatedTopics: ["Middleware", "Security", "Sessions"],
  },
  {
    title: "Middleware",
    keywords: ["middleware", "next", "express middleware", "custom middleware"],
    explanation:
      "Middleware functions execute during the request-response cycle. They have access to req, res, and next(). They can execute code, modify request/response, end the cycle, or call next middleware.",
    keyPoints: [
      "app.use() — Apply middleware to all routes",
      "next() — Pass control to next middleware",
      "Order matters: middleware runs in registration order",
      "Error middleware has 4 params: (err, req, res, next)",
      "Types: Application, Router, Error-handling, Built-in, Third-party",
    ],
    codeExample: `const express = require('express');
const app = express();

// Built-in
app.use(express.json());

// Custom Logger
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(\`\${req.method} \${req.url} \${res.statusCode} \${Date.now() - start}ms\`);
  });
  next();
}
app.use(logger);

// Auth Middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Error Handler (always last)
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});`,
    relatedTopics: ["Express.js", "Authentication", "Error Handling"],
  },
  {
    title: "Testing in Node.js",
    keywords: ["test", "testing", "jest", "vitest", "unit test", "tdd", "mock"],
    explanation:
      "Testing ensures your code works correctly. Unit tests check individual functions. Integration tests check components together. Jest and Vitest are popular testing frameworks.",
    keyPoints: [
      "Unit Tests — Test single functions in isolation",
      "Integration Tests — Test multiple components together",
      "AAA Pattern: Arrange, Act, Assert",
      "Mocks/Stubs replace dependencies",
      "TDD: Write test → Fail → Code → Pass → Refactor",
    ],
    codeExample: `// math.js
function add(a, b) { return a + b; }
function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}
module.exports = { add, divide };

// math.test.js
const { add, divide } = require('./math');

describe('Math', () => {
  test('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  test('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });
});`,
    relatedTopics: ["CI/CD", "Code Coverage", "TDD"],
  },
];

// ─── Mode-Specific Formatters ────────────────────────────────────────────────

function formatExplainResponse(topic: TopicKnowledge, _question: string): string {
  let r = `## ${topic.title}\n\n${topic.explanation}\n\n### 📌 Key Points\n\n`;
  topic.keyPoints.forEach((p) => { r += `- ${p}\n`; });
  if (topic.codeExample) r += `\n### 💻 Code Example\n\n\`\`\`javascript\n${topic.codeExample}\n\`\`\`\n`;
  if (topic.bestPractices) {
    r += `\n### ✅ Best Practices\n\n`;
    topic.bestPractices.forEach((bp) => { r += `- ${bp}\n`; });
  }
  if (topic.commonMistakes) {
    r += `\n### ⚠️ Common Mistakes\n\n`;
    topic.commonMistakes.forEach((m) => { r += `- ${m}\n`; });
  }
  if (topic.relatedTopics) r += `\n### 🔗 Related Topics\n\n${topic.relatedTopics.join(", ")}\n`;
  return r;
}

function formatCodeBreakdownResponse(topic: TopicKnowledge): string {
  if (!topic.codeExample) return `## ${topic.title}\n\nNo code example available. Try asking me to **explain** instead.\n`;
  let r = `## 🔍 Code Breakdown: ${topic.title}\n\nLet's break this down step by step:\n\n\`\`\`javascript\n${topic.codeExample}\n\`\`\`\n\n### Step-by-Step:\n\n`;
  const lines = topic.codeExample.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//"));
  lines.slice(0, 10).forEach((line, i) => {
    const t = line.trim();
    if (t.includes("require(") || t.includes("import ")) r += `${i + 1}. **\`${t}\`** — Imports a module\n`;
    else if (t.includes("const ") || t.includes("let ")) r += `${i + 1}. **\`${t}\`** — Declares a variable\n`;
    else if (t.includes("function ") || t.includes("=>")) r += `${i + 1}. **\`${t}\`** — Defines a function\n`;
    else if (t) r += `${i + 1}. **\`${t}\`** — Executes this statement\n`;
  });
  return r;
}

function formatHintResponse(topic: TopicKnowledge): string {
  let r = `## 💡 Hints: ${topic.title}\n\n`;
  topic.keyPoints.slice(0, 3).forEach((p, i) => { r += `**Hint ${i + 1}:** Think about... ${p.split("—")[0].trim()}\n\n`; });
  r += `> 🤔 Try implementing it yourself before looking at the solution!\n`;
  return r;
}

function formatDebugResponse(question: string, code?: string): string {
  let r = `## 🐛 Debug Assistant\n\n`;
  if (code) {
    r += `\`\`\`javascript\n${code}\n\`\`\`\n\n### Common things to check:\n\n`;
    r += `1. **Syntax Errors** — Missing brackets, semicolons, typos\n`;
    r += `2. **Undefined Variables** — Declare before use\n`;
    r += `3. **Async Issues** — Are you awaiting async functions?\n`;
    r += `4. **Scope Issues** — Variable accessibility\n`;
    r += `5. **Type Errors** — Calling methods on wrong types\n`;
  } else {
    r += `Share your code so I can help debug. General tips:\n\n`;
    r += `1. Read the error message carefully\n2. Check the stack trace\n3. Add console.log at key points\n4. Use \`node --inspect app.js\` for debugging\n`;
  }
  return r;
}

function formatSimplifyResponse(topic: TopicKnowledge): string {
  let r = `## 🎯 ${topic.title} — Simplified!\n\n**In simple words:** ${topic.explanation.split(".").slice(0, 2).join(".")}.\n\n`;
  const analogies: Record<string, string> = {
    "event loop": "Imagine a **waiter in a restaurant**. They take orders, send them to the kitchen, and while waiting, take more orders. When food is ready, they serve it. That's the Event Loop!",
    "module": "Modules are like **LEGO blocks**. Each does one thing. Snap them together to build something bigger!",
    "stream": "Streams are like a **water pipe**. Data flows continuously instead of loading all at once — efficient for large files!",
    "middleware": "Middleware is like **airport security checkpoints**. Each checkpoint does one thing. The request passes through each before reaching the gate!",
    "promise": "A Promise is like **ordering food online**. You place an order (pending), wait, and either receive food (fulfilled) or get cancellation (rejected)!",
  };
  const key = Object.keys(analogies).find((k) => topic.title.toLowerCase().includes(k));
  if (key) r += `### Think of it like this:\n\n${analogies[key]}\n\n`;
  r += `### 3 Key Things:\n\n`;
  topic.keyPoints.slice(0, 3).forEach((p, i) => { r += `${i + 1}. ${p}\n`; });
  return r;
}

function formatSocraticResponse(topic: TopicKnowledge): string {
  let r = `## 🏛️ Let's Think Together: ${topic.title}\n\n`;
  r += `**Q1:** What problem does ${topic.title} solve? Why do we need it?\n\n`;
  r += `**Q2:** Can you think of a real-world analogy for ${topic.title}?\n\n`;
  r += `**Q3:** What would happen without ${topic.title}?\n\n`;
  if (topic.codeExample) {
    r += `**Q4:** What does each part of this code do?\n\n\`\`\`javascript\n${topic.codeExample.split("\n").slice(0, 8).join("\n")}\n\`\`\`\n\n`;
  }
  r += `> Understanding the **why** is more important than memorizing the **how**! 🧠\n`;
  return r;
}

function formatPracticeResponse(topic: TopicKnowledge): string {
  let r = `## 📝 Practice: ${topic.title}\n\n`;
  r += `### Exercise 1 (Easy)\nWrite a program demonstrating ${topic.title}.\n\n`;
  r += `### Exercise 2 (Medium)\nBuild a small project using ${topic.title} with error handling.\n\n`;
  r += `### Exercise 3 (Challenge)\nCombine ${topic.title} with ${topic.relatedTopics?.[0] || "another concept"} for a real-world app.\n\n`;
  r += `### Key Concepts:\n\n`;
  topic.keyPoints.slice(0, 5).forEach((p) => { r += `- ${p}\n`; });
  if (topic.codeExample) r += `\n### Reference:\n\n\`\`\`javascript\n${topic.codeExample}\n\`\`\`\n`;
  return r;
}

// ─── Topic Matching ─────────────────────────────────────────────────────────

function findBestTopic(question: string): TopicKnowledge | null {
  const lowerQ = question.toLowerCase();
  let bestMatch: TopicKnowledge | null = null;
  let bestScore = 0;

  for (const topic of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (lowerQ.includes(keyword)) score += keyword.length;
    }
    if (score > bestScore) { bestScore = score; bestMatch = topic; }
  }
  return bestMatch;
}

function generateGenericResponse(question: string, mode: TutorMode, code?: string): string {
  if (mode === "debug" || mode === "code-breakdown") return formatDebugResponse(question, code);

  let r = `## 🤖 AI Tutor\n\nI understand your question: **"${question.substring(0, 100)}"**\n\n`;
  r += `### Available Topics:\n\n`;
  r += `- **Node.js Fundamentals** — Runtime, V8, event-driven architecture\n`;
  r += `- **Event Loop** — Async operations under the hood\n`;
  r += `- **Modules** — CommonJS, ES Modules\n`;
  r += `- **File System** — Reading, writing, streaming files\n`;
  r += `- **HTTP & Express.js** — Servers and REST APIs\n`;
  r += `- **Async/Await & Promises** — Asynchronous operations\n`;
  r += `- **Streams & Buffers** — Efficient data processing\n`;
  r += `- **Error Handling** — Try/catch, custom errors\n`;
  r += `- **npm & Packages** — Dependency management\n`;
  r += `- **Database & MongoDB** — Data persistence\n`;
  r += `- **Authentication & JWT** — User auth and security\n`;
  r += `- **Middleware** — Request processing pipeline\n`;
  r += `- **Testing** — Jest, unit tests, TDD\n\n`;
  r += `> 💡 Try asking about a specific topic for detailed explanations with code examples!\n`;
  return r;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateLocalResponse(
  question: string,
  mode: TutorMode = "explain",
  code?: string
): ProviderCallResult {
  const startTime = performance.now();
  const topic = findBestTopic(question);
  let content: string;

  if (!topic) {
    content = generateGenericResponse(question, mode, code);
  } else {
    switch (mode) {
      case "explain": case "deep-dive": case "compare": case "visualize":
        content = formatExplainResponse(topic, question); break;
      case "code-breakdown": case "execution":
        content = formatCodeBreakdownResponse(topic); break;
      case "hint":
        content = formatHintResponse(topic); break;
      case "debug":
        content = formatDebugResponse(question, code); break;
      case "simplify":
        content = formatSimplifyResponse(topic); break;
      case "socratic":
        content = formatSocraticResponse(topic); break;
      case "practice": case "interview":
        content = formatPracticeResponse(topic); break;
      case "review":
        content = code ? formatDebugResponse(question, code) : formatExplainResponse(topic, question); break;
      default:
        content = formatExplainResponse(topic, question);
    }
  }

  const latency = performance.now() - startTime;

  return {
    content,
    model: "local-knowledge-base",
    provider: "local",
    inputTokens: Math.ceil(question.length / 4),
    outputTokens: Math.ceil(content.length / 4),
    latency: Math.round(latency),
    cost: 0,
    cached: false,
  };
}

export function isLocalFallbackAvailable(): boolean {
  return true;
}
