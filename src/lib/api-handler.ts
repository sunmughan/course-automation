import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import { AppError, ValidationError } from "./errors";
import { createRequestLogger, logger } from "./logger";
import { getAuthUser } from "./auth";

interface HandlerContext {
  params: Promise<Record<string, string>>;
  request: NextRequest;
  user: Awaited<ReturnType<typeof getAuthUser>>;
  requestId: string;
}

type HandlerFn<T = unknown> = (ctx: HandlerContext) => Promise<T>;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  rateLimit?: {
    key: string;
    maxRequests: number;
    windowMs: number;
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);

export function apiHandler<T = unknown>(
  handler: HandlerFn<T>,
  options: ApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    routeParams: { params: Promise<Record<string, string>> }
  ) => {
    const requestId = generateRequestId();
    const reqLogger = createRequestLogger(requestId);
    const startTime = Date.now();

    try {
      if (options.rateLimit) {
        const { key, maxRequests, windowMs } = options.rateLimit;
        const identifier = request.headers.get("x-forwarded-for") || "anonymous";
        const rateLimitKey = `${key}:${identifier}`;

        if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
          reqLogger.warn("Rate limit exceeded");
          return NextResponse.json(
            { error: "Too many requests", code: "RATE_LIMIT" },
            { status: 429 }
          );
        }
      }

      let user = null;
      if (options.requireAuth || options.requireAdmin) {
        user = await getAuthUser(request);
        if (!user) {
          reqLogger.warn("Unauthorized access attempt");
          return NextResponse.json(
            { error: "Unauthorized", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }

        if (options.requireAdmin && user.role !== "admin") {
          reqLogger.warn("Forbidden - admin only", { userId: user.id });
          return NextResponse.json(
            { error: "Forbidden", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
      }

      if (options.bodySchema) {
        try {
          const body = await request.json();
          const parsed = options.bodySchema.parse(body);
          const ctx: HandlerContext = {
            params: routeParams.params,
            request,
            user,
            requestId,
          };
          (ctx as unknown as Record<string, unknown>).body = parsed;
          const result = await handler(ctx as HandlerContext);
          reqLogger.info("Request completed", {
            duration: Date.now() - startTime,
            method: request.method,
            path: request.nextUrl.pathname,
          });
          if (result instanceof Response) return result;
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof z.ZodError) {
            reqLogger.warn("Validation error", {
              errors: error.issues,
              path: request.nextUrl.pathname,
            });
            return NextResponse.json(
              {
                error: "Validation failed",
                code: "VALIDATION_ERROR",
                details: error.issues.map((e) => ({
                  field: e.path.join("."),
                  message: e.message,
                })),
              },
              { status: 400 }
            );
          }
          throw error;
        }
      }

      if (options.querySchema) {
        try {
          const query = Object.fromEntries(request.nextUrl.searchParams);
          const parsed = options.querySchema.parse(query);
          const ctx: HandlerContext = {
            params: routeParams.params,
            request,
            user,
            requestId,
          };
          (ctx as unknown as Record<string, unknown>).query = parsed;
          const result = await handler(ctx as HandlerContext);
          reqLogger.info("Request completed", {
            duration: Date.now() - startTime,
            method: request.method,
            path: request.nextUrl.pathname,
          });
          if (result instanceof Response) return result;
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof z.ZodError) {
            reqLogger.warn("Query validation error", {
              errors: error.issues,
              path: request.nextUrl.pathname,
            });
            return NextResponse.json(
              {
                error: "Invalid query parameters",
                code: "VALIDATION_ERROR",
                details: error.issues.map((e) => ({
                  field: e.path.join("."),
                  message: e.message,
                })),
              },
              { status: 400 }
            );
          }
          throw error;
        }
      }

      const ctx: HandlerContext = {
        params: routeParams.params,
        request,
        user,
        requestId,
      };
      const result = await handler(ctx);
      reqLogger.info("Request completed", {
        duration: Date.now() - startTime,
        method: request.method,
        path: request.nextUrl.pathname,
      });
      if (result instanceof Response) return result;
      return NextResponse.json(result);
    } catch (error) {
      reqLogger.error("Request failed", error as Error, {
        duration: Date.now() - startTime,
        method: request.method,
        path: request.nextUrl.pathname,
      });

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }
  };
}