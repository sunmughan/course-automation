import type { TutorMode } from "@/types";

export type ErrorCategory =
  | "syntax"
  | "runtime"
  | "logic"
  | "type"
  | "async"
  | "scope"
  | "reference"
  | "off_by_one"
  | "infinite_loop"
  | "null_undefined"
  | "api_misuse"
  | "performance"
  | "security"
  | "best_practice"
  | "conceptual";

export interface ErrorPattern {
  category: ErrorCategory;
  patterns: RegExp[];
  commonCauses: string[];
  fixStrategy: "guided" | "direct" | "analogy";
  explanationTemplate: string;
  preventionTips: string[];
}

export interface CorrectionStrategy {
  name: string;
  description: string;
  steps: string[];
  whenToUse: ErrorCategory[];
  example: string;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    category: "syntax",
    patterns: [
      /Unexpected token/i,
      /Unexpected end of input/i,
      /missing .* (?:bracket|parenthesis|brace|semicolon)/i,
      /SyntaxError/i,
      /unterminated/i,
    ],
    commonCauses: [
      "Missing closing bracket, parenthesis, or brace",
      "Missing semicolon (in strict mode)",
      "Invalid or unexpected token",
      "Unterminated string literal",
    ],
    fixStrategy: "guided",
    explanationTemplate: "This is a syntax error. The JavaScript engine can't parse your code because of incorrect syntax. {specific_issue}.",
    preventionTips: [
      "Use a code editor with syntax highlighting",
      "Enable auto-formatting (Prettier)",
      "Check bracket matching before running",
      "Use ESLint to catch syntax errors early",
    ],
  },
  {
    category: "runtime",
    patterns: [
      /TypeError/i,
      /ReferenceError/i,
      /RangeError/i,
      /URIError/i,
      /is not a function/i,
      /is not defined/i,
      /cannot read propert/i,
      /Cannot read properties of/i,
      /undefined is not/i,
      /null is not/i,
    ],
    commonCauses: [
      "Calling a method on undefined or null",
      "Accessing a variable that doesn't exist",
      "Using a value outside its valid range",
      "Calling something that isn't a function",
    ],
    fixStrategy: "guided",
    explanationTemplate: "This is a runtime error. Your code syntax is correct, but something went wrong when it executed. {specific_issue}.",
    preventionTips: [
      "Check variable initialization before use",
      "Use optional chaining (?.) for nested properties",
      "Add null/undefined checks",
      "Use TypeScript for compile-time type checking",
    ],
  },
  {
    category: "logic",
    patterns: [
      /wrong (?:output|result|answer)/i,
      /incorrect (?:calculation|value)/i,
      /expected .* but got/i,
      /not .* expected/i,
    ],
    commonCauses: [
      "Incorrect conditional logic",
      "Wrong operator (== vs ===, > vs >=)",
      "Off-by-one errors in loops",
      "Incorrect algorithm implementation",
      "Wrong order of operations",
    ],
    fixStrategy: "guided",
    explanationTemplate: "This is a logic error. Your code runs without errors but produces incorrect results. {specific_issue}.",
    preventionTips: [
      "Write unit tests for your logic",
      "Use console.log to trace variable values",
      "Break complex logic into smaller functions",
      "Test edge cases (empty input, negative numbers, etc.)",
    ],
  },
  {
    category: "async",
    patterns: [
      /Promise/i,
      /async/i,
      /await/i,
      /pending/i,
      /unhandled.*rejection/i,
      /Promise.*pending/i,
      /\.then.*not.*function/i,
      /callback.*hell/i,
    ],
    commonCauses: [
      "Forgetting to await a promise",
      "Not handling promise rejections",
      "Mixing callbacks and promises incorrectly",
      "Race conditions in async operations",
    ],
    fixStrategy: "guided",
    explanationTemplate: "This is an async/await error. Your asynchronous code isn't behaving as expected. {specific_issue}.",
    preventionTips: [
      "Always await promises or use .then().catch()",
      "Use try/catch with async/await",
      "Handle Promise.all rejections",
      "Use async/await consistently instead of mixing patterns",
    ],
  },
  {
    category: "scope",
    patterns: [
      /is not defined/i,
      /not accessible/i,
      /out of scope/i,
      /variable.*not.*declared/i,
      /cannot access.*before initialization/i,
    ],
    commonCauses: [
      "Using var instead of let/const (hoisting issues)",
      "Accessing variable outside its scope",
      "Variable shadowing",
      "Temporal dead zone (accessing let/const before declaration)",
    ],
    fixStrategy: "guided",
    explanationTemplate: "This is a scope error. You're trying to access a variable that isn't available in the current scope. {specific_issue}.",
    preventionTips: [
      "Use let and const instead of var",
      "Declare variables at the top of their scope",
      "Be aware of block scope vs function scope",
      "Use meaningful variable names to avoid shadowing",
    ],
  },
  {
    category: "off_by_one",
    patterns: [
      /index.*out.*bound/i,
      /undefined.*index/i,
      /last.*missing/i,
      /first.*skipped/i,
      /one.*too.*many/i,
      /one.*too.*few/i,
    ],
    commonCauses: [
      "Using <= instead of < in loop conditions",
      "Starting loop at wrong index",
      "Array index confusion (0-based vs 1-based)",
      "Incorrect slice or substring boundaries",
    ],
    fixStrategy: "direct",
    explanationTemplate: "This is an off-by-one error. Your loop or index is off by one position. {specific_issue}.",
    preventionTips: [
      "Remember arrays are 0-indexed",
      "Double-check loop boundaries",
      "Test with arrays of different lengths",
      "Use for...of when you don't need the index",
    ],
  },
  {
    category: "null_undefined",
    patterns: [
      /cannot read propert/i,
      /Cannot read properties of/i,
      /undefined is not/i,
      /null is not/i,
      /cannot.*null/i,
      /cannot.*undefined/i,
    ],
    commonCauses: [
      "Not checking if a value is null/undefined before use",
      "API response not yet loaded",
      "DOM element not found",
      "Optional value not provided",
    ],
    fixStrategy: "direct",
    explanationTemplate: "You're trying to use a value that is null or undefined. {specific_issue}.",
    preventionTips: [
      "Use optional chaining (?.)",
      "Use nullish coalescing (??)",
      "Add guard clauses at the start of functions",
      "Initialize variables with default values",
    ],
  },
  {
    category: "conceptual",
    patterns: [
      /don't understand/i,
      /why.*work/i,
      /how.*work/i,
      /what.*difference/i,
      /confused.*about/i,
    ],
    commonCauses: [
      "Misunderstanding of fundamental concepts",
      "Confusion between similar concepts",
      "Gap in prerequisite knowledge",
      "Mental model doesn't match reality",
    ],
    fixStrategy: "analogy",
    explanationTemplate: "This seems to be a conceptual misunderstanding. Let's build a clear mental model. {specific_issue}.",
    preventionTips: [
      "Build from fundamentals before moving to advanced topics",
      "Use analogies and visualizations to build mental models",
      "Practice with simple examples first",
      "Explain the concept to someone else (rubber duck debugging)",
    ],
  },
];

export const CORRECTION_STRATEGIES: CorrectionStrategy[] = [
  {
    name: "Guided Discovery",
    description: "Lead the student to find the error themselves through questions",
    steps: [
      "Help them understand what the error message is saying",
      "Ask them to identify which line of code is causing the problem",
      "Guide them to trace the logic step by step",
      "Ask what they think the correct behavior should be",
      "Let them propose and test a fix",
    ],
    whenToUse: ["syntax", "runtime", "logic", "async", "scope"],
    example: "I see a TypeError saying 'cannot read property of undefined'. Which line is this happening on? Let's trace what value that variable has at that point.",
  },
  {
    name: "Direct Explanation",
    description: "Clearly explain the error and how to fix it, with reasoning",
    steps: [
      "Identify the exact error and its category",
      "Explain why this error occurs in simple terms",
      "Show the corrected code with explanation",
      "Explain why the fix works",
      "Provide prevention tips",
    ],
    whenToUse: ["off_by_one", "null_undefined", "syntax"],
    example: "This is an off-by-one error. Your loop starts at 0 but the array you're accessing starts at 1. Let's adjust the starting index.",
  },
  {
    name: "Analogy-Based",
    description: "Use real-world analogies to explain the error and fix",
    steps: [
      "Find a real-world analogy that matches the error",
      "Explain the error through the analogy",
      "Show how the fix relates to the analogy",
      "Connect back to the code",
      "Reinforce with the correct mental model",
    ],
    whenToUse: ["conceptual", "async", "scope"],
    example: "Think of async/await like ordering food at a restaurant. You place the order (fetch), then you wait for it (await). If you try to eat before the food arrives, you'll get an error — just like trying to use data before the promise resolves.",
  },
];

export function detectErrorCategory(
  errorMessage: string,
  code?: string
): { category: ErrorCategory; pattern: ErrorPattern; confidence: number } {
  const message = errorMessage.toLowerCase();

  let bestMatch: ErrorPattern | null = null;
  let bestConfidence = 0;

  for (const pattern of ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(message)) {
        const confidence = 0.7 + (pattern.patterns.indexOf(regex) / pattern.patterns.length) * 0.3;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = pattern;
        }
      }
    }
  }

  if (bestMatch) {
    return {
      category: bestMatch.category,
      pattern: bestMatch,
      confidence: bestConfidence,
    };
  }

  return {
    category: "conceptual" as ErrorCategory,
    pattern: ERROR_PATTERNS.find((p) => p.category === "conceptual")!,
    confidence: 0.3,
  };
}

export function selectCorrectionStrategy(
  category: ErrorCategory,
  studentLevel: string
): CorrectionStrategy {
  const strategies = CORRECTION_STRATEGIES.filter((s) =>
    s.whenToUse.includes(category)
  );

  if (strategies.length === 0) {
    return CORRECTION_STRATEGIES[0];
  }

  if (studentLevel === "beginner" && category === "conceptual") {
    return CORRECTION_STRATEGIES.find((s) => s.name === "Analogy-Based")!;
  }

  if (studentLevel === "advanced") {
    return CORRECTION_STRATEGIES.find((s) => s.name === "Guided Discovery")!;
  }

  return strategies[0];
}

export function generateErrorExplanation(
  errorMessage: string,
  code?: string,
  studentLevel: string = "intermediate"
): {
  errorCategory: ErrorCategory;
  explanation: string;
  fixStrategy: "guided" | "direct" | "analogy";
  commonCauses: string[];
  preventionTips: string[];
  guidedQuestions: string[];
} {
  const { category, pattern } = detectErrorCategory(errorMessage, code);

  let explanation = pattern.explanationTemplate.replace(
    "{specific_issue}",
    `Specifically: ${errorMessage.substring(0, 200)}`
  );

  const guidedQuestions: string[] = [];
  if (pattern.fixStrategy === "guided") {
    guidedQuestions.push(
      "What line of code is causing this error?",
      "What value do you expect the variable to have at this point?",
      "What would happen if you added a console.log before this line?"
    );
  }

  return {
    errorCategory: category,
    explanation,
    fixStrategy: pattern.fixStrategy,
    commonCauses: pattern.commonCauses,
    preventionTips: pattern.preventionTips,
    guidedQuestions,
  };
}

export function shouldAutoFix(
  category: ErrorCategory,
  studentLevel: string,
  attempts: number
): boolean {
  if (category === "syntax") return true;
  if (category === "off_by_one" && attempts >= 3) return true;
  if (category === "null_undefined" && studentLevel === "beginner") return true;
  return false;
}