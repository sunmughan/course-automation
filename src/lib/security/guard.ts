/**
 * Centralized Platform Security Guard
 * Implements defenses against Prompt Injection, XSS, Path Traversal, Command Injection, and Secret Leakage.
 */

export class SecurityGuard {
  // ── Prompt Injection Defense ──────────────────────────────────────────────

  private static PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /disregard\s+(all\s+)?(previous|system)\s+prompts/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /system\s*:\s*override/i,
    /new\s+system\s+directive/i,
    /bypass\s+safety\s+filters/i,
    /print\s+(your\s+)?(initial|system)\s+prompt/i,
    /reveal\s+(the\s+)?system\s+message/i,
  ];

  /**
   * Scans a user input for prompt injection attempts.
   */
  static inspectPromptInjection(input: string): { isSuspicious: boolean; matchedPattern?: string; sanitizedInput: string } {
    for (const pattern of this.PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return {
          isSuspicious: true,
          matchedPattern: pattern.source,
          sanitizedInput: input.replace(pattern, "[FILTERED_PROMPT_INJECTION]"),
        };
      }
    }
    return {
      isSuspicious: false,
      sanitizedInput: input,
    };
  }

  // ── XSS & HTML Sanitization ───────────────────────────────────────────────

  /**
   * Sanitizes untrusted strings to prevent XSS.
   */
  static sanitizeHtml(input: string): string {
    if (!input) return "";
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/javascript\s*:/gi, "blocked-scheme:")
      .replace(/data\s*:\s*text\/html/gi, "blocked-scheme:");
  }

  // ── Path Traversal & File Security ────────────────────────────────────────

  /**
   * Validates a file path to prevent directory traversal attacks (../).
   */
  static sanitizeFilePath(filePath: string): { isValid: boolean; safePath: string } {
    if (!filePath || typeof filePath !== "string") {
      return { isValid: false, safePath: "" };
    }

    // Block null bytes and Windows backslash bypasses
    if (filePath.includes("\0") || filePath.includes("\\")) {
      filePath = filePath.replace(/\\/g, "/").replace(/\0/g, "");
    }

    // Block absolute path attempts and parent traversal
    const normalized = filePath.replace(/^\/+/, "").replace(/\.\.\//g, "").replace(/\/\.\./g, "");

    const isValid = !filePath.includes("../") && !filePath.startsWith("/") && !filePath.includes("..\\");

    return {
      isValid,
      safePath: normalized,
    };
  }

  // ── Secret Masking & Redaction ────────────────────────────────────────────

  private static SECRET_PATTERNS: Array<{ regex: RegExp; replace: (...args: any[]) => string }> = [
    { regex: /sk-[a-zA-Z0-9]{20,}/gi, replace: () => "[REDACTED_SECRET]" },
    { regex: /AIza[0-9A-Za-z-_]{35}/gi, replace: () => "[REDACTED_SECRET]" },
    { regex: /sk-ant-[a-zA-Z0-9-_]{20,}/gi, replace: () => "[REDACTED_SECRET]" },
    { regex: /ghp_[a-zA-Z0-9]{36}/gi, replace: () => "[REDACTED_SECRET]" },
    { regex: /Bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi, replace: () => "Bearer [REDACTED_TOKEN]" },
    { regex: /(password\s*[:=]\s*["']?)([^"'\s\n]{3,})(["']?)/gi, replace: (_m: string, p1: string, _p2: string, p3?: string) => `${p1}[REDACTED_PASSWORD]${p3 || ""}` },
  ];

  /**
   * Masks secret tokens and credentials in strings, JSON objects, and error traces.
   */
  static maskSecrets(text: string): string {
    if (!text || typeof text !== "string") return text;

    let sanitized = text;
    for (const item of this.SECRET_PATTERNS) {
      sanitized = sanitized.replace(item.regex, item.replace as any);
    }
    return sanitized;
  }

  // ── File Upload Validation ────────────────────────────────────────────────

  private static ALLOWED_EXTENSIONS = new Set([
    "js", "jsx", "ts", "tsx", "json", "css", "html", "md", "txt", "py", "sql", "csv",
  ]);

  /**
   * Validates file upload extension and size limit.
   */
  static validateUpload(fileName: string, sizeBytes: number, maxBytes = 5 * 1024 * 1024): { valid: boolean; error?: string } {
    if (sizeBytes > maxBytes) {
      return { valid: false, error: `File size exceeds limit of ${Math.round(maxBytes / (1024 * 1024))}MB` };
    }

    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext || !this.ALLOWED_EXTENSIONS.has(ext)) {
      return { valid: false, error: `File extension .${ext} is not supported for security` };
    }

    return { valid: true };
  }
}
