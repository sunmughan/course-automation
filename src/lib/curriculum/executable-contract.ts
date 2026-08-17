import { z } from "zod";

// ── Types & Schemas ──────────────────────────────────────────────────────────

export interface ExecutableExample {
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCases?: string;
  expectedOutput?: string;
  difficulty?: number;
  conceptTitles?: string[];
}

export interface ExecutableExercise {
  title: string;
  description: string;
  instructions?: string;
  starterCode: string;
  solutionCode: string;
  testCases: string;
  hints: string;
  difficulty?: number;
  expectedOutput?: string;
  conceptTitles?: string[];
}

export interface ExecutableConcept {
  title: string;
  description: string;
}

export interface ExecutableVisualization {
  type: string;
  title: string;
  config: string;
}

export interface ExecutableTopic {
  title: string;
  description: string;
  slug: string;
  difficulty: number;
  prerequisites?: number[];
  concepts: ExecutableConcept[];
  examples: ExecutableExample[];
  exercises: ExecutableExercise[];
  visualizations?: ExecutableVisualization[];
  lesson: {
    title: string;
    content: string;
    explanation: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Disallowed Placeholders ──────────────────────────────────────────────────

const FORBIDDEN_PLACEHOLDER_PATTERNS = [
  /^\s*\/\/\s*(TODO|implement|placeholder|your code here|TBD|fixme)/i,
  /^\s*#\s*(TODO|implement|placeholder|your code here|TBD|fixme)/i,
  /^\s*pass\s*$/i,
  /^\s*\.\.\.\s*$/,
  /^\s*TODO/i,
  /^\s*placeholder/i,
];

function isPlaceholderOnly(code: string): boolean {
  if (!code || code.trim().length === 0) return true;
  const trimmed = code.trim();
  for (const pattern of FORBIDDEN_PLACEHOLDER_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

// ── Validators ───────────────────────────────────────────────────────────────

export function validateExecutableExample(example: ExecutableExample): ValidationResult {
  const errors: string[] = [];

  if (!example.title || example.title.trim().length < 3) {
    errors.push("Example title must be at least 3 characters");
  }
  if (!example.description || example.description.trim().length < 10) {
    errors.push("Example description must be at least 10 characters");
  }
  if (!example.starterCode || example.starterCode.trim().length < 5) {
    errors.push("Example starterCode is required and must provide scaffolding");
  }
  if (!example.solutionCode || example.solutionCode.trim().length < 10) {
    errors.push("Example solutionCode is required");
  } else if (isPlaceholderOnly(example.solutionCode)) {
    errors.push("Example solutionCode cannot be a placeholder");
  }

  return { valid: errors.length === 0, errors };
}

export function validateExecutableExercise(exercise: ExecutableExercise): ValidationResult {
  const errors: string[] = [];

  if (!exercise.title || exercise.title.trim().length < 3) {
    errors.push("Exercise title must be at least 3 characters");
  }
  if (!exercise.description || exercise.description.trim().length < 10) {
    errors.push("Exercise description must be at least 10 characters");
  }
  if (!exercise.starterCode || exercise.starterCode.trim().length < 5) {
    errors.push("Exercise starterCode is required and must provide starter scaffolding");
  }
  if (!exercise.solutionCode || exercise.solutionCode.trim().length < 15) {
    errors.push("Exercise solutionCode is required and must contain working code");
  } else if (isPlaceholderOnly(exercise.solutionCode)) {
    errors.push("Exercise solutionCode cannot be a placeholder string");
  }
  if (!exercise.testCases || exercise.testCases.trim().length < 10) {
    errors.push("Exercise testCases are required and must specify test assertions");
  }
  if (!exercise.hints || exercise.hints.trim().length < 10) {
    errors.push("Exercise hints are required to provide actionable learning guidance");
  }

  return { valid: errors.length === 0, errors };
}

export function validateExecutableTopic(topic: ExecutableTopic): ValidationResult {
  const errors: string[] = [];

  if (!topic.title || topic.title.trim().length < 3) {
    errors.push("Topic title must be at least 3 characters");
  }
  if (!topic.description || topic.description.trim().length < 15) {
    errors.push("Topic description must be at least 15 characters");
  }
  if (!topic.slug || topic.slug.trim().length < 2) {
    errors.push("Topic slug is required");
  }
  if (!topic.difficulty || topic.difficulty < 1 || topic.difficulty > 5) {
    errors.push("Topic difficulty must be an integer between 1 and 5");
  }

  // Validate Concepts
  if (!Array.isArray(topic.concepts) || topic.concepts.length === 0) {
    errors.push("Topic must have at least one concept");
  } else {
    topic.concepts.forEach((c, idx) => {
      if (!c.title || c.title.trim().length < 2) {
        errors.push(`Concept #${idx + 1} is missing a title`);
      }
      if (!c.description || c.description.trim().length < 20) {
        errors.push(`Concept #${idx + 1} (${c.title || "unnamed"}) must have a descriptive explanation (>=20 chars)`);
      }
    });
  }

  // Validate Examples
  if (!Array.isArray(topic.examples) || topic.examples.length === 0) {
    errors.push("Topic must have at least one executable example");
  } else {
    topic.examples.forEach((ex, idx) => {
      const res = validateExecutableExample(ex);
      if (!res.valid) {
        errors.push(...res.errors.map((e) => `Example #${idx + 1} (${ex.title || "unnamed"}): ${e}`));
      }
    });
  }

  // Validate Exercises
  if (!Array.isArray(topic.exercises) || topic.exercises.length === 0) {
    errors.push("Topic must have at least one executable exercise");
  } else {
    topic.exercises.forEach((ex, idx) => {
      const res = validateExecutableExercise(ex);
      if (!res.valid) {
        errors.push(...res.errors.map((e) => `Exercise #${idx + 1} (${ex.title || "unnamed"}): ${e}`));
      }
    });
  }

  // Validate Lesson
  if (!topic.lesson) {
    errors.push("Topic must have a lesson object");
  } else {
    if (!topic.lesson.title || topic.lesson.title.trim().length < 3) {
      errors.push("Lesson title is required");
    }
    if (!topic.lesson.content || topic.lesson.content.trim().length < 50) {
      errors.push("Lesson content must provide substantial theory (>=50 chars)");
    }
    if (!topic.lesson.explanation || topic.lesson.explanation.trim().length < 20) {
      errors.push("Lesson explanation is required (>=20 chars)");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Throws an error if a topic fails executable contract validation.
 */
export function assertExecutableTopic(topic: ExecutableTopic): void {
  const result = validateExecutableTopic(topic);
  if (!result.valid) {
    throw new Error(
      `Executable Contract Violation in topic "${topic.title || topic.slug}":\n  - ${result.errors.join("\n  - ")}`
    );
  }
}
