import { prisma } from "@/lib/db";
import type { WeakTopic } from "./weak-detection";

export interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  difficulty: number;
  focusArea: string;
  hints: string[];
  topicId: string;
  topicName: string;
}

export interface ExerciseRequest {
  userId: string;
  topicId?: string;
  count?: number;
  difficulty?: number;
  language?: string;
}

export async function generatePersonalizedExercises(request: ExerciseRequest): Promise<GeneratedExercise[]> {
  const { userId, topicId, count = 3, difficulty, language = "javascript" } = request;

  const [skills, mistakes, topic] = await Promise.all([
    topicId
      ? prisma.studentSkill.findUnique({ where: { userId_topicId: { userId, topicId } } })
      : null,
    prisma.studentMistake.findMany({
      where: { userId, ...(topicId ? { topicId } : {}) },
      orderBy: { count: "desc" },
      take: 5,
    }),
    topicId
      ? prisma.topic.findUnique({ where: { id: topicId }, select: { title: true, difficulty: true } })
      : null,
  ]);

  const targetDifficulty = difficulty ?? topic?.difficulty ?? 2;
  const focusAreas = extractFocusAreas(mistakes, skills);
  const exercises: GeneratedExercise[] = [];

  for (let i = 0; i < Math.min(count, 5); i++) {
    const focusArea = focusAreas[i % focusAreas.length];
    const exercise = generateExerciseForFocusArea(
      focusArea,
      targetDifficulty,
      language,
      topic?.title || "General Practice",
      topicId || "general"
    );
    exercises.push(exercise);
  }

  return exercises;
}

function extractFocusAreas(
  mistakes: Array<{ error: string; count: number }>,
  skill: { score: number } | null
): string[] {
  const areas: string[] = [];

  if (skill && skill.score < 40) {
    areas.push("fundamentals");
  }

  for (const m of mistakes) {
    const error = m.error.toLowerCase();
    if (error.includes("syntax") || error.includes("unexpected")) areas.push("syntax");
    if (error.includes("undefined") || error.includes("null")) areas.push("null-safety");
    if (error.includes("type") || error.includes("is not a function")) areas.push("type-safety");
    if (error.includes("async") || error.includes("promise")) areas.push("async");
    if (error.includes("scope") || error.includes("not defined")) areas.push("scope");
    if (error.includes("reference") || error.includes("cannot read")) areas.push("references");
    if (error.includes("loop") || error.includes("iterate")) areas.push("loops");
    if (error.includes("array") || error.includes("object")) areas.push("data-structures");
  }

  if (areas.length === 0) {
    areas.push("general", "algorithms", "data-structures");
  }

  return [...new Set(areas)];
}

function generateExerciseForFocusArea(
  focusArea: string,
  difficulty: number,
  language: string,
  topicName: string,
  topicId: string
): GeneratedExercise {
  const templates: Record<string, (d: number, l: string, t: string, tid: string) => GeneratedExercise> = {
    fundamentals: (d, l, t, tid) => ({
      title: `${t}: Fundamentals Practice`,
      description: `Strengthen your understanding of core ${l} concepts.`,
      instructions: generateFundamentalsInstructions(d, l),
      starterCode: generateFundamentalsStarter(d, l),
      difficulty: d,
      focusArea: "fundamentals",
      hints: generateFundamentalsHints(d),
      topicId: tid,
      topicName: t,
    }),
    syntax: (d, l, t, tid) => ({
      title: `${t}: Syntax Fixer`,
      description: `Practice identifying and fixing common ${l} syntax errors.`,
      instructions: generateSyntaxInstructions(d, l),
      starterCode: generateSyntaxStarter(l),
      difficulty: d,
      focusArea: "syntax",
      hints: ["Check for missing brackets, semicolons, or quotes", "Look at the error message for the exact line"],
      topicId: tid,
      topicName: t,
    }),
    "null-safety": (d, l, t, tid) => ({
      title: `${t}: Null Safety Challenge`,
      description: `Handle null and undefined values safely in ${l}.`,
      instructions: generateNullSafetyInstructions(d, l),
      starterCode: generateNullSafetyStarter(d, l),
      difficulty: d,
      focusArea: "null-safety",
      hints: ["Use optional chaining (?.) or null checks", "Consider using default values or guard clauses"],
      topicId: tid,
      topicName: t,
    }),
    async: (d, l, t, tid) => ({
      title: `${t}: Async Operations`,
      description: `Master asynchronous programming patterns in ${l}.`,
      instructions: generateAsyncInstructions(d, l),
      starterCode: generateAsyncStarter(d, l),
      difficulty: d,
      focusArea: "async",
      hints: ["Use async/await for cleaner async code", "Don't forget to handle errors with try/catch"],
      topicId: tid,
      topicName: t,
    }),
    loops: (d, l, t, tid) => ({
      title: `${t}: Loop Mastery`,
      description: `Practice working with loops and iteration in ${l}.`,
      instructions: generateLoopInstructions(d, l),
      starterCode: generateLoopStarter(d, l),
      difficulty: d,
      focusArea: "loops",
      hints: ["Consider which loop type is most appropriate", "Watch out for off-by-one errors"],
      topicId: tid,
      topicName: t,
    }),
    "data-structures": (d, l, t, tid) => ({
      title: `${t}: Data Structures Drill`,
      description: `Manipulate arrays, objects, and other data structures in ${l}.`,
      instructions: generateDataStructuresInstructions(d, l),
      starterCode: generateDataStructuresStarter(d, l),
      difficulty: d,
      focusArea: "data-structures",
      hints: ["Use built-in methods like map, filter, reduce", "Think about which data structure is most efficient"],
      topicId: tid,
      topicName: t,
    }),
    general: (d, l, t, tid) => ({
      title: `${t}: Practice Challenge`,
      description: `Apply your ${l} skills to solve a practical problem.`,
      instructions: generateGeneralInstructions(d, l),
      starterCode: generateGeneralStarter(d, l),
      difficulty: d,
      focusArea: "general",
      hints: ["Break the problem into smaller steps", "Test your solution with different inputs"],
      topicId: tid,
      topicName: t,
    }),
  };

  const template = templates[focusArea] || templates.general;
  return template(difficulty, language, topicName, topicId);
}

function generateFundamentalsInstructions(difficulty: number, language: string): string {
  if (difficulty <= 1) {
    return `Write a simple program that declares variables, performs basic arithmetic, and prints the result.`;
  }
  if (difficulty === 2) {
    return `Create a function that takes parameters and returns a computed value. Include input validation.`;
  }
  return `Build a small module with multiple functions that work together to solve a problem.`;
}

function generateFundamentalsStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return difficulty <= 1
      ? "// Declare variables and perform calculations\n// Your code here\n"
      : "// TODO: Create a function that calculates the factorial of a number\nfunction factorial(n) {\n  // Your code here\n}\n\nconsole.log(factorial(5)); // Expected: 120\n";
  }
  if (language === "python") {
    return difficulty <= 1
      ? "# Declare variables and perform calculations\n# Your code here\n"
      : "# TODO: Create a function that calculates the factorial of a number\ndef factorial(n):\n    # Your code here\n    pass\n\nprint(factorial(5))  # Expected: 120\n";
  }
  return "// Write your code here\n";
}

function generateFundamentalsHints(difficulty: number): string[] {
  if (difficulty <= 1) return ["Start with simple variable declarations", "Use console.log() or print() to see results"];
  return ["Use recursion or a loop for factorial", "Remember to handle the base case (n <= 1)"];
}

function generateSyntaxInstructions(difficulty: number, language: string): string {
  return `The following code has syntax errors. Find and fix them so it runs correctly.`;
}

function generateSyntaxStarter(language: string): string {
  if (language === "javascript") {
    return `// Fix the syntax errors in this code\nfunction greet(name) {\n  return "Hello, " + name\n}\n\nconst result = greet("World"\nconsole.log(result);\n`;
  }
  return `// Fix the syntax errors\n# Your buggy code here\n`;
}

function generateNullSafetyInstructions(difficulty: number, language: string): string {
  return `Write a function that safely accesses nested properties of an object. Handle cases where intermediate values might be null or undefined.`;
}

function generateNullSafetyStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return `// TODO: Safely get the city from a user object\n// The user object may have missing nested properties\nfunction getCity(user) {\n  // Your code here - handle null/undefined safely\n}\n\nconst user1 = { address: { city: "Mumbai" } };\nconst user2 = { address: null };\nconst user3 = null;\n\nconsole.log(getCity(user1)); // Expected: "Mumbai"\nconsole.log(getCity(user2)); // Expected: "Unknown"\nconsole.log(getCity(user3)); // Expected: "Unknown"\n`;
  }
  return `// Write your null-safe code here\n`;
}

function generateAsyncInstructions(difficulty: number, language: string): string {
  if (difficulty <= 2) {
    return `Write a function that fetches data from two sources and combines the results. Use async/await pattern.`;
  }
  return `Implement a function that processes multiple async operations in parallel with proper error handling.`;
}

function generateAsyncStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return `// TODO: Fetch user data and posts, then combine them\nasync function getUserWithPosts(userId) {\n  // Simulate API calls\n  const getUser = (id) => Promise.resolve({ id, name: "Alice" });\n  const getPosts = (id) => Promise.resolve([{ title: "Post 1" }]);\n  \n  // Your code here\n}\n\ngetUserWithPosts(1).then(console.log);\n`;
  }
  return `// Write your async code here\n`;
}

function generateLoopInstructions(difficulty: number, language: string): string {
  if (difficulty <= 1) {
    return `Write a loop that iterates through an array and performs an operation on each element.`;
  }
  return `Given an array of numbers, use a loop to find all pairs that sum to a target value.`;
}

function generateLoopStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return difficulty <= 1
      ? `// TODO: Double each number in the array and print the results\nconst numbers = [1, 2, 3, 4, 5];\n// Your loop here\n`
      : `// TODO: Find all pairs that sum to the target\nfunction findPairs(arr, target) {\n  // Your code here\n}\n\nconsole.log(findPairs([1, 2, 3, 4, 5], 6));\n// Expected: [[1,5], [2,4]]\n`;
  }
  return `// Write your loop code here\n`;
}

function generateDataStructuresInstructions(difficulty: number, language: string): string {
  if (difficulty <= 2) {
    return `Given an array of objects, filter, transform, and sort the data to produce a specific output.`;
  }
  return `Design a data structure to efficiently store and query a collection of items with multiple attributes.`;
}

function generateDataStructuresStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return `// TODO: Transform the data\nconst students = [\n  { name: "Amit", score: 85 },\n  { name: "Priya", score: 92 },\n  { name: "Raj", score: 78 },\n  { name: "Sita", score: 95 },\n];\n\n// Return names of students with score >= 80, sorted by score descending\nfunction getTopStudents(students) {\n  // Your code here\n}\n\nconsole.log(getTopStudents(students));\n`;
  }
  return `// Write your data structures code here\n`;
}

function generateGeneralInstructions(difficulty: number, language: string): string {
  const challenges = [
    "Create a function that reverses a string without using built-in reverse methods.",
    "Write a function that checks if a string is a palindrome.",
    "Implement a function that finds the most frequent element in an array.",
    "Create a recursive function to calculate the nth Fibonacci number.",
    "Write a function that merges two sorted arrays into one sorted array.",
  ];
  return challenges[difficulty - 1] || challenges[0];
}

function generateGeneralStarter(difficulty: number, language: string): string {
  if (language === "javascript") {
    return `// TODO: Implement the challenge\nfunction solve(input) {\n  // Your code here\n}\n\nconsole.log(solve("hello"));\n`;
  }
  if (language === "python") {
    return `# TODO: Implement the challenge\ndef solve(input):\n    # Your code here\n    pass\n\nprint(solve("hello"))\n`;
  }
  return "// Write your code here\n";
}