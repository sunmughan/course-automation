import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from "@/lib/errors";

describe("AppError", () => {
  it("creates with default status 500", () => {
    const error = new AppError("Something broke");
    expect(error.message).toBe("Something broke");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("accepts custom status and code", () => {
    const error = new AppError("Custom", 400, "CUSTOM", { field: "x" });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("CUSTOM");
    expect(error.details).toEqual({ field: "x" });
  });
});

describe("NotFoundError", () => {
  it("creates with default message", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("customizes resource name", () => {
    const error = new NotFoundError("User");
    expect(error.message).toBe("User not found");
  });
});

describe("UnauthorizedError", () => {
  it("returns 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
  });
});

describe("ForbiddenError", () => {
  it("returns 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });
});

describe("ValidationError", () => {
  it("returns 400 with details", () => {
    const error = new ValidationError([{ field: "email", message: "Invalid" }]);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual([{ field: "email", message: "Invalid" }]);
  });
});

describe("ConflictError", () => {
  it("returns 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
  });
});

describe("RateLimitError", () => {
  it("returns 429", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
  });
});