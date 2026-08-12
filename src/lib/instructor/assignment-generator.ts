import { prisma } from "@/lib/db";
import { detectWeakTopics } from "@/lib/adaptive/weak-detection";

export interface GeneratedAssignment {
  title: string;
  description: string;
  instructions: string;
  type: "coding" | "debugging" | "design" | "review" | "essay";
  difficulty: number;
  maxScore: number;
  starterCode?: string;
  rubric: { criterion: string; points: number; description: string }[];
  focusTopics: string[];
  estimatedMinutes: number;
}

export interface GeneratedAssessment {
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questions: {
    type: "mcq" | "code" | "predict" | "debug";
    question: string;
    code?: string;
    options?: string[];
    correctAnswer?: string;
    explanation: string;
    points: number;
  }[];
  totalPoints: number;
}

export interface AssignmentRequest {
  batchId: string;
  instructorId: string;
  topicId?: string;
  type?: string;
  difficulty?: number;
  count?: number;
}

export interface AssessmentRequest {
  batchId: string;
  instructorId: string;
  topicId?: string;
  questionCount?: number;
  types?: string[];
}

async function getBatchWeakTopics(batchId: string, instructorId: string): Promise<string[]> {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
    include: { students: { select: { studentId: true } } },
  });

  if (!batch) throw new Error("Batch not found");

  const weakTopicSet = new Set<string>();
  for (const s of batch.students) {
    const weakTopics = await detectWeakTopics(s.studentId);
    for (const wt of weakTopics.slice(0, 3)) {
      weakTopicSet.add(wt.topicName);
    }
  }
  return Array.from(weakTopicSet);
}

const CODING_TEMPLATES: Record<string, ((desc: string, diff: number) => Partial<GeneratedAssignment>)[]> = {
  javascript: [
    (desc, diff) => ({
      title: `${desc}: Array Transformation Challenge`,
      description: `Practice array manipulation and functional programming patterns.`,
      instructions: `Write a function that processes an array of data according to the specified requirements. Handle edge cases including empty arrays, null values, and unexpected input types.
      
1. Create a function that filters, transforms, and aggregates data
2. Use map, filter, reduce where appropriate
3. Handle all edge cases gracefully
4. Return a well-structured result object`,
      starterCode: `function processData(data) {\n  // Input: Array of objects with { id, value, category }\n  // Process: Filter by category, transform values, aggregate\n  // Output: { total: number, categories: string[], items: object[] }\n  \n  return { total: 0, categories: [], items: [] };\n}\n\n// Test cases\nconsole.log(processData([]));\nconsole.log(processData(null));\nconsole.log(processData([{ id: 1, value: 100, category: 'A' }]));`,
      rubric: [
        { criterion: "Array filtering and transformation", points: 30, description: "Correctly filters and transforms array elements using built-in methods" },
        { criterion: "Edge case handling", points: 25, description: "Handles empty arrays, null, undefined, and invalid inputs" },
        { criterion: "Aggregation logic", points: 20, description: "Correctly aggregates values into the expected output format" },
        { criterion: "Code quality", points: 15, description: "Clean, readable code with meaningful variable names" },
        { criterion: "Results accuracy", points: 10, description: "Produces correct results for all test cases" },
      ],
      estimatedMinutes: 30 + diff * 10,
    }),
    (desc, diff) => ({
      title: `${desc}: Async Data Pipeline`,
      description: `Build an asynchronous data processing pipeline with error handling.`,
      instructions: `Implement a data pipeline that fetches, processes, and stores data asynchronously. Handle errors, timeouts, and retries.
      
1. Fetch data from a simulated API endpoint
2. Process and transform the data
3. Handle errors with retry logic
4. Store the processed results`,
      starterCode: `async function fetchData(url) {\n  // Simulate API call with possible failure\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      if (Math.random() > 0.3) resolve({ data: [1, 2, 3] });\n      else reject(new Error('Network error'));\n    }, 500);\n  });\n}\n\nasync function processPipeline(urls, maxRetries = 3) {\n  // Process multiple URLs with retry logic\n  const results = [];\n  for (const url of urls) {\n    try {\n      const data = await fetchData(url);\n      results.push(data);\n    } catch (err) {\n      // Handle error\n    }\n  }\n  return results;\n}`,
      rubric: [
        { criterion: "Async/await usage", points: 25, description: "Correct async/await pattern with proper error handling" },
        { criterion: "Retry logic", points: 25, description: "Implements retry with exponential backoff" },
        { criterion: "Error handling", points: 20, description: "Graceful error handling without crashing the pipeline" },
        { criterion: "Pipeline architecture", points: 20, description: "Clean pipeline design with clear stages" },
        { criterion: "Results aggregation", points: 10, description: "Properly aggregates and returns results" },
      ],
      estimatedMinutes: 45 + diff * 15,
    }),
    (desc, diff) => ({
      title: `${desc}: Event-Driven System`,
      description: `Design and implement an event-driven system with pub/sub pattern.`,
      instructions: `Create an event emitter/bus system that supports subscribing, publishing, and unsubscribing from events.
      
1. Implement an EventBus class with on(), off(), and emit() methods
2. Support wildcard subscriptions
3. Handle errors in event handlers without breaking the bus
4. Implement once() for one-time subscriptions`,
      starterCode: `class EventBus {\n  constructor() {\n    this.listeners = {};\n  }\n\n  on(event, callback) {\n    // Subscribe to event\n  }\n\n  off(event, callback) {\n    // Unsubscribe from event\n  }\n\n  emit(event, ...args) {\n    // Publish event to all subscribers\n  }\n\n  once(event, callback) {\n    // Subscribe once, then auto-unsubscribe\n  }\n}`,
      rubric: [
        { criterion: "Event subscription", points: 25, description: "Correct on() and off() implementation" },
        { criterion: "Event emission", points: 25, description: "Emit delivers data to all subscribers" },
        { criterion: "Error isolation", points: 20, description: "Handler errors don't affect other handlers" },
        { criterion: "Once pattern", points: 15, description: "once() auto-unsubscribes after first emission" },
        { criterion: "Wildcard support", points: 15, description: "Supports wildcard event matching" },
      ],
      estimatedMinutes: 40 + diff * 10,
    }),
  ],
  python: [
    (desc, diff) => ({
      title: `${desc}: Data Processing Pipeline`,
      description: `Build a data processing pipeline with Python generators and decorators.`,
      instructions: `Create a pipeline that reads, transforms, and writes data using Python generators and decorators.
      
1. Read data from a source using a generator
2. Apply transformations using decorators
3. Filter and aggregate results
4. Write output to a destination`,
      starterCode: `from typing import Iterator, Callable, Any\nfrom functools import wraps\nfrom dataclasses import dataclass\n\n@dataclass\nclass DataRecord:\n    id: int\n    value: float\n    category: str\n\ndef read_data() -> Iterator[DataRecord]:\n    # Generator that yields data records\n    yield DataRecord(1, 100.0, "A")\n\ndef transform(func: Callable) -> Callable:\n    # Decorator for data transformation\n    @wraps(func)\n    def wrapper(*args, **kwargs):\n        return func(*args, **kwargs)\n    return wrapper\n\ndef process_pipeline():\n    # Combine reading, transforming, writing\n    pass`,
      rubric: [
        { criterion: "Generator usage", points: 30, description: "Proper use of generators for memory-efficient processing" },
        { criterion: "Decorator implementation", points: 25, description: "Correct decorator pattern with functools.wraps" },
        { criterion: "Pipeline design", points: 25, description: "Clean pipeline composition with clear stages" },
        { criterion: "Error handling", points: 20, description: "Graceful error handling in pipeline stages" },
      ],
      estimatedMinutes: 35 + diff * 10,
    }),
    (desc, diff) => ({
      title: `${desc}: Machine Learning Model Comparison`,
      description: `Implement and compare multiple ML models for a classification task.`,
      instructions: `Build a model comparison framework that trains and evaluates multiple classifiers.
      
1. Load and preprocess a dataset
2. Train multiple models (LogisticRegression, RandomForest, SVC)
3. Evaluate with cross-validation
4. Generate comparison report with metrics`,
      starterCode: `from sklearn.datasets import make_classification\nfrom sklearn.model_selection import cross_val_score, train_test_split\nfrom sklearn.preprocessing import StandardScaler\n\nX, y = make_classification(n_samples=1000, n_features=20, n_classes=2, random_state=42)\n\nclass ModelComparator:\n    def __init__(self, models):\n        self.models = models\n        self.results = {}\n    \n    def compare(self, X, y, cv=5):\n        # Train and evaluate each model\n        pass\n    \n    def report(self):\n        # Generate comparison report\n        pass`,
      rubric: [
        { criterion: "Data preprocessing", points: 20, description: "Proper scaling and train/test split" },
        { criterion: "Model training", points: 25, description: "Multiple models trained correctly" },
        { criterion: "Cross-validation", points: 25, description: "Proper CV with multiple metrics" },
        { criterion: "Report generation", points: 20, description: "Clear comparison with accuracy, precision, recall" },
        { criterion: "Code organization", points: 10, description: "Well-structured class with clear methods" },
      ],
      estimatedMinutes: 45 + diff * 15,
    }),
    (desc, diff) => ({
      title: `${desc}: API Rate Limiter`,
      description: `Implement a rate limiter with sliding window algorithm.`,
      instructions: `Design a rate limiter that uses the sliding window algorithm to control API request rates.
      
1. Implement sliding window counter
2. Support per-user and per-endpoint limits
3. Handle concurrent requests safely
4. Include cleanup of expired entries`,
      starterCode: `from collections import defaultdict\nfrom time import time\nfrom threading import Lock\n\nclass RateLimiter:\n    def __init__(self, max_requests=100, window_seconds=60):\n        self.max_requests = max_requests\n        self.window = window_seconds\n        self.requests = defaultdict(list)\n        self.lock = Lock()\n    \n    def is_allowed(self, user_id: str) -> bool:\n        # Check if request is within rate limit\n        pass\n    \n    def record_request(self, user_id: str):\n        # Record a new request\n        pass\n    \n    def cleanup(self):\n        # Remove expired entries\n        pass`,
      rubric: [
        { criterion: "Sliding window algorithm", points: 30, description: "Correct sliding window implementation" },
        { criterion: "Thread safety", points: 25, description: "Thread-safe with proper locking" },
        { criterion: "Per-user limits", points: 20, description: "Supports per-user and per-endpoint limits" },
        { criterion: "Cleanup mechanism", points: 15, description: "Efficient cleanup of expired entries" },
        { criterion: "Edge cases", points: 10, description: "Handles edge cases (0 requests, burst, etc.)" },
      ],
      estimatedMinutes: 35 + diff * 10,
    }),
  ],
};

const DEBUGGING_TEMPLATES = [
  {
    title: "Debug the Buggy Sorter",
    description: "Find and fix the bugs in this sorting implementation.",
    instructions: "The code below contains 3 bugs. Find and fix all of them. The function should correctly sort an array in ascending order.",
    starterCode: `function buggySort(arr) {\n  if (!arr) return [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length; j++) {\n      if (arr[i] > arr[j]) {\n        let temp = arr[i];\n        arr[i] = arr[j];\n        arr[j] = temp;\n      }\n    }\n  }\n  return arr;\n}\n\nconsole.log(buggySort([3, 1, 4, 1, 5, 9])); // Should output [1, 1, 3, 4, 5, 9]`,
    rubric: [
      { criterion: "Bug 1: Inner loop start", points: 30, description: "Fixed j loop to start at i+1 instead of 0" },
      { criterion: "Bug 2: Comparison direction", points: 30, description: "Fixed comparison for ascending order" },
      { criterion: "Bug 3: Stability", points: 20, description: "Ensured stable sorting behavior" },
      { criterion: "Code quality", points: 20, description: "Clean fix with proper comments" },
    ],
    estimatedMinutes: 20,
  },
  {
    title: "Fix the Memory Leak",
    description: "Identify and fix the memory leak in this event handling code.",
    instructions: "The code below has a memory leak. Find the cause and fix it. Consider proper cleanup and resource management.",
    starterCode: `class DataViewer {\n  constructor() {\n    this.data = [];\n    this.interval = setInterval(() => {\n      this.data.push(new Array(1000000).fill('x'));\n      console.log('Data size:', this.data.length);\n    }, 1000);\n  }\n\n  fetchData() {\n    window.addEventListener('resize', () => {\n      console.log('Resized!');\n    });\n  }\n\n  destroy() {\n    // This method is never called\n  }\n}`,
    rubric: [
      { criterion: "Interval cleanup", points: 30, description: "Added clearInterval in destroy method" },
      { criterion: "Event listener removal", points: 30, description: "Removed event listener on destroy" },
      { criterion: "Data cleanup", points: 20, description: "Nullified data references to allow GC" },
      { criterion: "Destroy call", points: 20, description: "Added proper destroy invocation pattern" },
    ],
    estimatedMinutes: 25,
  },
];

const DESIGN_TEMPLATES = [
  {
    title: "Design a URL Shortener",
    description: "Design a scalable URL shortening service like bit.ly.",
    instructions: "Design the system architecture for a URL shortener that handles 100M URLs per day. Include:\n\n1. System architecture diagram\n2. Database schema\n3. API design\n4. Scaling strategy\n5. Security considerations",
    starterCode: `# URL Shortener System Design\n\n## Requirements\n- 100M URLs/day\n- Short URLs (7 chars)\n- Redirect with < 10ms latency\n- Analytics on clicks\n\n## Architecture\n[Describe your architecture here]\n\n## Database Schema\n[Define your schema here]\n\n## API Design\nPOST /api/shorten\nGET /:shortCode\n\n## Scaling\n[Describe scaling strategy]`,
    rubric: [
      { criterion: "Architecture completeness", points: 25, description: "Well-defined architecture covering all components" },
      { criterion: "Database design", points: 20, description: "Proper schema with indexing strategy" },
      { criterion: "API design", points: 20, description: "RESTful API with proper status codes and error handling" },
      { criterion: "Scaling strategy", points: 20, description: "Caching, sharding, and load balancing strategy" },
      { criterion: "Security", points: 15, description: "Rate limiting, input validation, abuse prevention" },
    ],
    estimatedMinutes: 45,
  },
  {
    title: "Design a Chat System",
    description: "Design a real-time chat system supporting group chats and media sharing.",
    instructions: "Design a real-time chat application that supports:\n\n1. 1-on-1 and group chats\n2. Message delivery guarantees\n3. Online/offline status\n4. Media sharing (images, files)\n5. Message search\n\nInclude architecture, data model, and API design.",
    starterCode: `# Real-time Chat System Design\n\n## Requirements\n- 1M concurrent users\n- Message delivery < 200ms\n- Support groups up to 1000 members\n- Media files up to 50MB\n\n## Architecture\n[Describe your architecture here]\n\n## Data Model\n[Define your data model here]\n\n## API Design\n[Define your APIs here]`,
    rubric: [
      { criterion: "Real-time architecture", points: 25, description: "WebSocket/SSE with fallback strategy" },
      { criterion: "Data model", points: 20, description: "Efficient schema for messages, users, groups" },
      { criterion: "Delivery guarantees", points: 20, description: "At-least-once delivery with deduplication" },
      { criterion: "Media handling", points: 20, description: "File upload, storage, and thumbnail generation" },
      { criterion: "Scalability", points: 15, description: "Horizontal scaling, sharding, and caching" },
    ],
    estimatedMinutes: 50,
  },
];

export async function generateAssignments(
  request: AssignmentRequest
): Promise<GeneratedAssignment[]> {
  const { batchId, instructorId, topicId, type, difficulty = 2, count = 3 } = request;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
  });
  if (!batch) throw new Error("Batch not found");

  const weakTopics = await getBatchWeakTopics(batchId, instructorId);
  const focusTopics = weakTopics.length > 0 ? weakTopics.slice(0, 3) : ["General Programming"];

  const assignments: GeneratedAssignment[] = [];

  if (type === "debugging" || !type) {
    for (const template of DEBUGGING_TEMPLATES) {
      assignments.push({
        ...template,
        type: "debugging",
        difficulty,
        maxScore: 100,
        focusTopics,
      });
    }
  }

  if (type === "design" || !type) {
    for (const template of DESIGN_TEMPLATES) {
      assignments.push({
        ...template,
        type: "design",
        difficulty,
        maxScore: 100,
        focusTopics,
      });
    }
  }

  if (type === "coding" || !type) {
    const lang = "javascript";
    const templates = CODING_TEMPLATES[lang] || CODING_TEMPLATES.javascript;
    const desc = focusTopics[0] || "General";
    for (const templateFn of templates) {
      const template = templateFn(desc, difficulty);
      assignments.push({
        type: "coding",
        difficulty,
        maxScore: 100,
        focusTopics,
        ...template,
        title: template.title || "",
        description: template.description || "",
        instructions: template.instructions || "",
        rubric: template.rubric || [],
        estimatedMinutes: template.estimatedMinutes || 30,
      });
    }
  }

  const uniqueAssignments: GeneratedAssignment[] = [];
  const seen = new Set<string>();
  for (const a of assignments) {
    if (!seen.has(a.title)) {
      seen.add(a.title);
      uniqueAssignments.push(a);
    }
  }

  return uniqueAssignments.slice(0, count);
}

export async function generateAssessment(
  request: AssessmentRequest
): Promise<GeneratedAssessment> {
  const { batchId, instructorId, topicId, questionCount = 5, types = ["mcq", "code"] } = request;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
  });
  if (!batch) throw new Error("Batch not found");

  const weakTopics = await getBatchWeakTopics(batchId, instructorId);
  const focusTopic = weakTopics[0] || "Software Engineering";

  const questions: GeneratedAssessment["questions"] = [];

  const mcqQuestions = [
    {
      type: "mcq" as const,
      question: `What is the primary purpose of ${focusTopic} in software development?`,
      options: [
        "To increase code complexity",
        "To improve code organization and maintainability",
        "To reduce the number of files",
        "To eliminate the need for testing",
      ],
      correctAnswer: "To improve code organization and maintainability",
      explanation: `${focusTopic} helps organize code into logical units, making it easier to maintain, test, and scale.`,
      points: 10,
    },
    {
      type: "mcq" as const,
      question: `Which of the following is a best practice when working with ${focusTopic}?`,
      options: [
        "Write everything in a single file",
        "Avoid documentation",
        "Follow consistent naming conventions",
        "Skip error handling",
      ],
      correctAnswer: "Follow consistent naming conventions",
      explanation: "Consistent naming conventions improve code readability and make collaboration easier.",
      points: 10,
    },
    {
      type: "mcq" as const,
      question: `What is the time complexity of a binary search algorithm?`,
      options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
      correctAnswer: "O(log n)",
      explanation: "Binary search halves the search space each iteration, resulting in logarithmic time complexity.",
      points: 10,
    },
    {
      type: "mcq" as const,
      question: "Which HTTP status code indicates a successful POST request that created a resource?",
      options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
      correctAnswer: "201 Created",
      explanation: "201 Created indicates that the request succeeded and a new resource was created as a result.",
      points: 10,
    },
    {
      type: "mcq" as const,
      question: "What is the purpose of version control systems like Git?",
      options: [
        "To make code run faster",
        "To track changes and enable collaboration",
        "To automatically fix bugs",
        "To replace documentation",
      ],
      correctAnswer: "To track changes and enable collaboration",
      explanation: "Version control systems track file changes over time and enable multiple developers to work together.",
      points: 10,
    },
  ];

  const codeQuestions = [
    {
      type: "code" as const,
      question: `Write a function that demonstrates ${focusTopic} concepts. The function should be well-structured, handle edge cases, and include error handling.`,
      code: `// Write your solution here\n// Focus on: ${focusTopic}\n\nfunction solution(input) {\n  // Your code here\n}\n\n// Test cases\nconsole.log(solution([1, 2, 3]));`,
      explanation: `Tests understanding of ${focusTopic} fundamentals, including edge case handling and code organization.`,
      points: 25,
    },
    {
      type: "code" as const,
      question: "Implement a function that validates input data and returns meaningful error messages for invalid inputs.",
      code: `// Input validation function\n\nfunction validate(data) {\n  // Check for required fields, types, and constraints\n  // Return { valid: boolean, errors: string[] }\n}`,
      explanation: "Tests input validation, error handling, and defensive programming skills.",
      points: 25,
    },
  ];

  const predictQuestions = [
    {
      type: "predict" as const,
      question: "What will be the output of the following code?",
      code: `let x = [1, 2, 3];\nlet y = x;\ny.push(4);\nconsole.log(x);\nconsole.log(x === y);`,
      options: ["[1,2,3] and false", "[1,2,3,4] and true", "[1,2,3] and true", "[1,2,3,4] and false"],
      correctAnswer: "[1,2,3,4] and true",
      explanation: "Arrays are reference types. y references the same array as x, so pushing to y also affects x.",
      points: 10,
    },
    {
      type: "predict" as const,
      question: "What does this closure output?",
      code: `function createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    get: () => count,\n  };\n}\nconst c = createCounter();\nconsole.log(c.increment());\nconsole.log(c.increment());\nconsole.log(c.get());`,
      options: ["1, 2, 2", "1, 1, 1", "0, 0, 0", "1, 2, 3"],
      correctAnswer: "1, 2, 2",
      explanation: "The closure captures count. increment() returns the pre-incremented value, so first call returns 1, second returns 2, and get() returns current count (2).",
      points: 10,
    },
  ];

  if (types.includes("mcq")) {
    questions.push(...mcqQuestions.slice(0, Math.ceil(questionCount * 0.6)));
  }
  if (types.includes("code")) {
    questions.push(...codeQuestions.slice(0, Math.ceil(questionCount * 0.3)));
  }
  if (types.includes("predict")) {
    questions.push(...predictQuestions.slice(0, Math.ceil(questionCount * 0.2)));
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return {
    title: `${focusTopic} Assessment`,
    description: `Comprehensive assessment covering ${focusTopic} concepts. Tests understanding through multiple question types.`,
    timeLimit: 45,
    passingScore: Math.round(totalPoints * 0.7),
    questions: questions.slice(0, questionCount),
    totalPoints,
  };
}