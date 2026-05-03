import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {} from "@fastify/swagger";

import type { AuditDb } from "@pramanasystems/audit-db";

const S_ERROR = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export function registerAuditRoutes(
  app: FastifyInstance,
  auditDb: AuditDb,
): void {

  // GET /audit/decisions?limit=50&offset=0&policy_id=...&decision=...&from=...&to=...
  app.get<{
    Querystring: {
      limit?: number;
      offset?: number;
      policy_id?: string;
      decision?: "approve" | "deny" | "any";
      from?: string;
      to?: string;
    };
  }>("/audit/decisions", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Decision timeline",
      description:
        "Returns a paginated, filtered list of governance decisions joined with their " +
        "latest verification status. Ordered by executed_at descending.",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          limit:     { type: "integer", minimum: 1, maximum: 1000, default: 50,
                       description: "Max rows (default 50, max 1000)" },
          offset:    { type: "integer", minimum: 0, default: 0,
                       description: "Row offset for pagination (default 0)" },
          policy_id: { type: "string", maxLength: 200,
                       description: "Filter by exact policy_id" },
          decision:  { type: "string", enum: ["approve", "deny", "any"],
                       description: "Filter by decision value; 'any' returns all" },
          from:      { type: "string", format: "date-time",
                       description: "ISO 8601 lower bound on executed_at (inclusive)" },
          to:        { type: "string", format: "date-time",
                       description: "ISO 8601 upper bound on executed_at (inclusive)" },
        },
      },
      response: {
        200: { description: "Decision timeline rows", type: "array", items: { type: "object" } },
        400: { description: "Invalid query parameters", ...S_ERROR },
        500: S_ERROR,
      },
    },
  }, async (req, reply: FastifyReply): Promise<void> => {
    const { limit, offset: _offset, policy_id, decision, from, to } = req.query;
    const parsedLimit = parseInt(String(limit ?? 50), 10);
    const normalizedDecision = decision === "any" ? undefined : decision;
    try {
      reply.send(await auditDb.getDecisionTimeline(parsedLimit, {
        policy_id: policy_id || undefined,
        decision:  normalizedDecision,
        from_date: from || undefined,
        to_date:   to   || undefined,
      }));
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /audit/decisions/:executionId
  app.get<{ Params: { executionId: string } }>("/audit/decisions/:executionId", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Decision detail",
      description: "Returns the full audit record for a single governance decision, including the stored attestation JSONB.",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: { executionId: { type: "string", minLength: 1, maxLength: 200 } },
        required: ["executionId"],
      },
      response: {
        200: { description: "Audit decision record", type: "object" },
        400: { description: "Invalid path parameters", ...S_ERROR },
        404: S_ERROR,
        500: S_ERROR,
      },
    },
  }, async (
    req: FastifyRequest<{ Params: { executionId: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      const decision = await auditDb.getDecisionById(req.params.executionId);
      if (!decision) {
        reply.code(404).send({ error: "Decision not found" });
        return;
      }
      reply.send(decision);
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /audit/security?from=...&to=...&limit=50
  app.get<{
    Querystring: {
      from?: string;
      to?: string;
      limit?: number;
    };
  }>("/audit/security", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Security dashboard",
      description:
        "Returns aggregated security event counts grouped by event_type and severity, " +
        "ordered by event_count descending.",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          from:  { type: "string", format: "date-time",
                   description: "ISO 8601 lower bound on occurred_at (inclusive)" },
          to:    { type: "string", format: "date-time",
                   description: "ISO 8601 upper bound on occurred_at (inclusive)" },
          limit: { type: "integer", minimum: 1, maximum: 1000, default: 50,
                   description: "Max rows (default 50, max 1000)" },
        },
      },
      response: {
        200: { description: "Security event summary", type: "array", items: { type: "object" } },
        400: { description: "Invalid query parameters", ...S_ERROR },
        500: S_ERROR,
      },
    },
  }, async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      reply.send(await auditDb.getSecurityDashboard());
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /audit/stats
  app.get("/audit/stats", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Audit statistics",
      description:
        "Returns aggregate counts across all audit tables: total decisions, decisions today, " +
        "verifications (valid/invalid), security events, and API access calls.",
      security: [{ bearerAuth: [] }],
      response: {
        200: { description: "Aggregate audit statistics", type: "object" },
        500: S_ERROR,
      },
    },
  }, async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      reply.send(await auditDb.getStats());
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /audit/verifications/:executionId
  app.get<{ Params: { executionId: string } }>("/audit/verifications/:executionId", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Verification history",
      description: "Returns all verification attempts for a given execution ID, newest first.",
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        properties: { executionId: { type: "string", format: "uuid" } },
        required: ["executionId"],
      },
      response: {
        200: { description: "Verification records", type: "array", items: { type: "object" } },
        500: S_ERROR,
      },
    },
  }, async (
    req: FastifyRequest<{ Params: { executionId: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      reply.send(await auditDb.getVerificationsByExecution(req.params.executionId));
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });
}
