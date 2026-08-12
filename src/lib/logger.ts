type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    entry.level.toUpperCase().padEnd(5),
    entry.message,
  ];

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context));
  }

  if (entry.error) {
    parts.push(`\n  Error: ${entry.error}`);
    if (entry.stack) {
      parts.push(`\n  Stack: ${entry.stack}`);
    }
  }

  return parts.join(" ");
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error?.message,
    stack: error?.stack,
  };
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
  if (!shouldLog(level)) return;

  const entry = createEntry(level, message, context, error);
  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) =>
    log("error", message, context, error),
};

export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, context?: Record<string, unknown>) =>
      logger.debug(message, { requestId, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      logger.info(message, { requestId, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      logger.warn(message, { requestId, ...context }),
    error: (message: string, error?: Error, context?: Record<string, unknown>) =>
      logger.error(message, error, { requestId, ...context }),
  };
}