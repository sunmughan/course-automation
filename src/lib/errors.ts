import { z } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("Validation failed", 400, "VALIDATION_ERROR", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT");
  }
}

export const authSchemas = {
  register: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),

  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

export const courseSchemas = {
  enroll: z.object({
    courseId: z.string().min(1),
  }),
};

export const lessonSchemas = {
  complete: z.object({
    score: z.number().min(0).max(100).optional(),
    timeSpent: z.number().min(0).optional(),
  }),
};

export const aiSchemas = {
  chat: z.object({
    message: z.string().min(1, "Message is required").max(10000),
    lessonId: z.string().optional(),
    topicId: z.string().optional(),
    mode: z.string().default("explain"),
    conversationId: z.string().optional(),
    code: z.string().optional(),
    executionResult: z.any().optional(),
    selectedLine: z.number().optional(),
    selectedEventIndex: z.number().optional(),
    enforceStructuredOutput: z.boolean().optional(),
  }),

  explain: z.object({
    concept: z.string().min(1),
    context: z.string().optional(),
  }),

  orchestrate: z.object({
    task: z.string().min(1),
    agents: z.array(z.string()).optional(),
  }),
};

export const codeSchemas = {
  run: z.object({
    code: z.string().min(1, "Code is required").max(100000),
    language: z.enum(["javascript", "python", "typescript", "java", "c", "cpp", "kotlin", "html", "css", "json", "sql", "markdown", "php"]).default("javascript"),
    timeout: z.number().min(1000).max(30000).default(10000),
    trace: z.boolean().optional(),
    topicId: z.string().optional(),
    lessonId: z.string().optional(),
  }),
};