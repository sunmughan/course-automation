import { prisma } from "@/lib/db";
import { SecurityGuard } from "./guard";

export type SecurityEventType =
  | "auth_failure"
  | "rbac_violation"
  | "prompt_injection_attempt"
  | "path_traversal_attempt"
  | "rate_limit_exceeded"
  | "unauthorized_tenant_access"
  | "privilege_escalation_attempt";

export interface SecurityAuditParams {
  eventType: SecurityEventType;
  userId?: string;
  organizationId?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityAudit {
  /**
   * Logs a security audit event into the database with secret sanitization.
   */
  static async logEvent(params: SecurityAuditParams) {
    const { eventType, userId, organizationId, resource, resourceId, details, ipAddress, userAgent } = params;

    const sanitizedDetails = details
      ? SecurityGuard.maskSecrets(JSON.stringify(details))
      : null;

    try {
      return await prisma.auditLog.create({
        data: {
          action: `security:${eventType}`,
          userId: userId || null,
          organizationId: organizationId || null,
          resource,
          resourceId: resourceId || null,
          details: sanitizedDetails,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (err) {
      console.error("[SecurityAudit] Failed to log audit record:", err);
      return null;
    }
  }
}
