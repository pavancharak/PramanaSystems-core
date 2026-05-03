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

  // GET /audit/decisions?limit=100&policy_id=...&decision=...&from=...&to=...
  app.get<{
    Querystring: {
      limit?: string;
      policy_id?: string;
      decision?: string;
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
          limit:     { type: "string", description: "Max rows (default 100, max 1000)" },
          policy_id: { type: "string", description: "Filter by exact policy_id" },
          decision:  { type: "string", description: "Filter by decision value (e.g. approve, deny)" },
          from:      { type: "string", description: "ISO date lower bound on executed_at (inclusive)" },
          to:        { type: "string", description: "ISO date upper bound on executed_at (inclusive)" },
        },
      },
      response: {
        200: { description: "Decision timeline rows", type: "array", items: { type: "object" } },
        500: S_ERROR,
      },
    },
  }, async (req, reply: FastifyReply): Promise<void> => {
    const { limit, policy_id, decision, from, to } = req.query;
    const parsedLimit = Math.min(parseInt(limit ?? "100", 10) || 100, 1000);
    try {
      reply.send(await auditDb.getDecisionTimeline(parsedLimit, {
        policy_id: policy_id || undefined,
        decision:  decision  || undefined,
        from_date: from      || undefined,
        to_date:   to        || undefined,
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
        properties: { executionId: { type: "string", format: "uuid" } },
        required: ["executionId"],
      },
      response: {
        200: { description: "Audit decision record", type: "object" },
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

  // GET /audit/security
  app.get("/audit/security", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Audit"],
      summary: "Security dashboard",
      description:
        "Returns aggregated security event counts grouped by event_type and severity, " +
        "ordered by event_count descending.",
      security: [{ bearerAuth: [] }],
      response: {
        200: { description: "Security event summary", type: "array", items: { type: "object" } },
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
