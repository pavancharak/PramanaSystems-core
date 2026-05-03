import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {} from "@fastify/swagger";

import type { Verifier, RuntimeManifest, ExecutionAttestation } from "@pramanasystems/execution";
import { verifyAttestation } from "@pramanasystems/verifier";
import type { AuditDb } from "@pramanasystems/audit-db";

const S_EXECUTION_RESULT = {
  type: "object",
  properties: {
    execution_id:    { type: "string", format: "uuid" },
    policy_id:       { type: "string" },
    policy_version:  { type: "string" },
    schema_version:  { type: "string" },
    runtime_version: { type: "string" },
    runtime_hash:    { type: "string" },
    decision:        { type: "string" },
    signals_hash:    { type: "string" },
    executed_at:     { type: "string", format: "date-time" },
  },
  required: [
    "execution_id", "policy_id", "policy_version", "schema_version",
    "runtime_version", "runtime_hash", "decision", "signals_hash", "executed_at",
  ],
};

const S_ATTESTATION = {
  type: "object",
  properties: {
    result:    S_EXECUTION_RESULT,
    signature: { type: "string", description: "Base64 Ed25519 signature over the result" },
  },
  required: ["result", "signature"],
};

const S_VERIFICATION_RESULT = {
  type: "object",
  properties: {
    valid: { type: "boolean" },
    checks: {
      type: "object",
      properties: {
        signature_verified: { type: "boolean" },
        runtime_verified:   { type: "boolean" },
        schema_compatible:  { type: "boolean" },
      },
      required: ["signature_verified", "runtime_verified", "schema_compatible"],
    },
  },
  required: ["valid", "checks"],
};

const S_ERROR = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

const S_RATE_LIMIT_ERROR = {
  type: "object",
  properties: {
    error:     { type: "string" },
    limit:     { type: "integer" },
    remaining: { type: "integer" },
    reset:     { type: "integer", description: "Unix timestamp when the rate limit resets" },
  },
  required: ["error", "limit", "remaining", "reset"],
};

export interface VerifyRouteDeps {
  verifier: Verifier;
  runtimeManifest: RuntimeManifest;
  auditDb?: AuditDb;
}

export function registerVerifyRoute(
  app: FastifyInstance,
  deps: VerifyRouteDeps,
): void {
  const { verifier, runtimeManifest, auditDb } = deps;

  app.post<{ Body: ExecutionAttestation }>("/verify", {
    bodyLimit: 65536,
    config: { rateLimit: { max: 200, timeWindow: "1 minute" } },
    schema: {
      tags: ["Verification"],
      summary: "Verify an execution attestation",
      description:
        "Checks the cryptographic signature, runtime hash, and schema version " +
        "of an attestation produced by POST /execute.",
      security: [{ bearerAuth: [] }],
      body: {
        ...S_ATTESTATION,
        additionalProperties: false,
        description: "An ExecutionAttestation as returned by POST /execute",
      },
      response: {
        200:  { description: "Verification result with per-check breakdown", ...S_VERIFICATION_RESULT },
        400:  { description: "Malformed attestation body", ...S_ERROR },
        413:  { description: "Request body too large", ...S_ERROR },
        422:  { description: "Verification threw an unexpected error", ...S_ERROR },
        429:  { description: "Rate limit exceeded", ...S_RATE_LIMIT_ERROR },
      },
    },
  }, async (
    req: FastifyRequest<{ Body: ExecutionAttestation }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const body = req.body;

    if (!body?.result || typeof body.signature !== "string") {
      reply.code(400).send({
        error: "Body must be an ExecutionAttestation with result and signature fields",
      });
      return;
    }

    try {
      const result = verifyAttestation(body, verifier, runtimeManifest);
      auditDb?.recordVerification(body.result.execution_id, result);
      req.log.info({ reqId: req.id, valid: result.valid, checks: result.checks }, "verify:success");
      reply.send(result);
    } catch (err) {
      reply.code(422).send({ error: (err as Error).message });
    }
  });
}
