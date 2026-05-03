import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {} from "@fastify/swagger";

import type { Signer, Verifier } from "@pramanasystems/execution";
import { executeSimple } from "@pramanasystems/execution";
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

const S_ERROR = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

export interface ExecuteRouteDeps {
  signer: Signer;
  verifier: Verifier;
  auditDb?: AuditDb;
}

interface ExecuteBody {
  policy_id: string;
  policy_version: string;
  decision_type: string;
  signals_hash: string;
}

export function registerExecuteRoute(
  app: FastifyInstance,
  deps: ExecuteRouteDeps,
): void {
  const { signer, verifier, auditDb } = deps;

  app.post<{ Body: ExecuteBody }>("/execute", {
    schema: {
      tags: ["Execution"],
      summary: "Execute a governance decision",
      description:
        "Issues an execution token, runs the deterministic governance runtime, " +
        "and returns a signed ExecutionAttestation.",
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        properties: {
          policy_id:      { type: "string", description: "Policy identifier" },
          policy_version: { type: "string", description: "Semantic version of the policy" },
          decision_type:  { type: "string", description: "Decision type to execute (e.g. approve, deny)" },
          signals_hash:   { type: "string", description: "SHA-256 hex digest of the input signals payload" },
        },
        required: ["policy_id", "policy_version", "decision_type", "signals_hash"],
      },
      response: {
        200: { description: "Signed execution attestation", ...S_ATTESTATION },
        400: { description: "Missing or invalid request fields", ...S_ERROR },
        422: { description: "Execution failed (policy not found, token expired, replay detected)", ...S_ERROR },
      },
    },
  }, async (
    req: FastifyRequest<{ Body: ExecuteBody }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const { policy_id, policy_version, decision_type, signals_hash } =
      req.body ?? ({} as ExecuteBody);

    if (!policy_id || !policy_version || !decision_type || !signals_hash) {
      reply.code(400).send({
        error: "Missing required fields: policy_id, policy_version, decision_type, signals_hash",
      });
      return;
    }

    try {
      const attestation = executeSimple(
        {
          policyId:      policy_id,
          policyVersion: policy_version,
          decisionType:  decision_type,
          signalsHash:   signals_hash,
        },
        signer,
        verifier,
      );
      auditDb?.recordDecision(attestation);
      reply.send(attestation);
    } catch (err) {
      reply.code(422).send({ error: (err as Error).message });
    }
  });
}
