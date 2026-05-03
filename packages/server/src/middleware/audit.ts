import type { FastifyRequest, FastifyReply } from "fastify";
import type { AuditDb } from "@pramanasystems/audit-db";

export function createAuditMiddleware(auditDb: AuditDb) {
  return async function onResponse(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    auditDb.recordApiAccess({
      method:          req.method,
      path:            req.url,
      status_code:     reply.statusCode,
      response_time_ms: Number.isFinite(reply.elapsedTime)
        ? Math.round(reply.elapsedTime)
        : undefined,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (reply.statusCode === 401) {
      auditDb.recordSecurityEvent({
        event_type: "auth_failure",
        severity:   "medium",
        ip_address: req.ip,
        path:       req.url,
        method:     req.method,
        user_agent: req.headers["user-agent"],
        details:    { status_code: 401 },
      });
    }
  };
}
