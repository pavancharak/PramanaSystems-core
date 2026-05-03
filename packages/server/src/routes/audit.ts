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

  // GET /audit/decisions?limit=100
  app.get<{ Querystring: { limit?: string } }>("/audit/decisions", {
    schema: {
      tags: ["Audit"],
      summary: "Decision timeline",
      description:
        "Returns a paginated list of governance decisions joined with their " +
        "latest verification status. Ordered by executed_at descending.",
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "string", description: "Max rows (default 100, max 1000)" },
        },
      },
      response: {
        200: { description: "Decision timeline rows", type: "array", items: { type: "object" } },
        500: S_ERROR,
      },
    },
  }, async (
    req: FastifyRequest<{ Querystring: { limit?: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 1000);
    try {
      reply.send(await auditDb.getDecisionTimeline(limit));
    } catch (err) {
      reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /audit/decisions/:executionId
  app.get<{ Params: { executionId: string } }>("/audit/decisions/:executionId", {
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

  // GET /audit/verifications/:executionId
  app.get<{ Params: { executionId: string } }>("/audit/verifications/:executionId", {
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
