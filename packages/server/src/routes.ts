import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";

import type {} from "@fastify/swagger";

import { getRuntimeManifest, type Signer, type Verifier, type RuntimeManifest } from "@pramanasystems/execution";
import { existsSync } from "node:fs";

import type { AuditDb } from "@pramanasystems/audit-db";

import { registerExecuteRoute } from "./routes/execute.js";
import { registerVerifyRoute }  from "./routes/verify.js";
import { registerAuditRoutes }  from "./routes/audit.js";

// ── Reusable JSON Schema fragments (stubs only — active routes own their schemas) ──

const S_ERROR = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
};

const S_NOT_IMPLEMENTED = {
  ...S_ERROR,
  properties: { error: { type: "string", enum: ["Not implemented"] } },
};

// ── Health check helpers ──────────────────────────────────────────────────────

function checkRuntime(): "ok" | "error" {
  try { getRuntimeManifest(); return "ok"; } catch { return "error"; }
}

function checkSigningKey(): "ok" | "unconfigured" {
  if (process.env.PRAMANA_PRIVATE_KEY) return "ok";
  if (existsSync("./dev-keys/bundle_signing_key")) return "ok";
  return "unconfigured";
}

async function checkAuditDb(db: AuditDb | undefined): Promise<"ok" | "unavailable" | "unconfigured"> {
  if (!db) return "unconfigured";
  try { await db.ping(); return "ok"; } catch { return "unavailable"; }
}

// ── Deps ──────────────────────────────────────────────────────────────────────

/** Runtime dependencies injected into each route handler at registration time. */
export interface RouteDeps {
  /** Signer used to produce attestations in the `/execute` route. */
  signer: Signer;
  /** Verifier used to check attestation signatures in the `/verify` route. */
  verifier: Verifier;
  /** Active runtime manifest embedded in every execution result. */
  runtimeManifest: RuntimeManifest;
  /** Optional audit database client. When present, all decisions and verifications
   *  are recorded fire-and-forget and audit query routes are registered. */
  auditDb?: AuditDb;
}

// ── Route registration ────────────────────────────────────────────────────────

/**
 * Registers all governance API routes on `app`.
 *
 * Active routes (fully implemented):
 * - `GET  /health`   — runtime health and version.
 * - `POST /execute`  — deterministic governance decision with signed attestation.
 * - `POST /verify`   — independent attestation verification.
 *
 * Audit routes (registered when `auditDb` is configured):
 * - `GET  /audit/decisions`               — decision timeline (paginated).
 * - `GET  /audit/decisions/:executionId`  — single decision detail.
 * - `GET  /audit/security`                — security event dashboard.
 * - `GET  /audit/verifications/:executionId` — verification history.
 *
 * Stub routes (return `501 Not Implemented`):
 * - `GET  /runtime/manifest`     — signed runtime bundle manifest.
 * - `GET  /runtime/capabilities` — runtime capability declarations.
 * - `POST /evaluate`             — policy dry-run (no attestation).
 * - `POST /simulate`             — full pipeline dry-run (no side effects).
 */
export function registerRoutes(
  app: FastifyInstance,
  deps: RouteDeps,
): void {
  const { signer, verifier, runtimeManifest, auditDb } = deps;

  // GET /health ──────────────────────────────────────────────────────────────

  app.get("/health", {
    config: { rateLimit: { max: 300, timeWindow: "1 minute" } },
    schema: {
      tags: ["Runtime"],
      summary: "Health check",
      response: {
        200: {
          description: "Server health status with per-subsystem checks",
          type: "object",
          properties: {
            status:    { type: "string", enum: ["ok", "degraded"] },
            version:   { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            checks: {
              type: "object",
              properties: {
                runtime_manifest: { type: "string", enum: ["ok", "error"] },
                signing_key:      { type: "string", enum: ["ok", "unconfigured"] },
                audit_db:         { type: "string", enum: ["ok", "unavailable", "unconfigured"] },
              },
              required: ["runtime_manifest", "signing_key", "audit_db"],
            },
          },
          required: ["status", "version", "timestamp", "checks"],
        },
      },
    },
  }, async () => {
    const checks = {
      runtime_manifest: checkRuntime(),
      signing_key:      checkSigningKey(),
      audit_db:         await checkAuditDb(auditDb),
    };
    const degraded = Object.values(checks).some(v => v === "error" || v === "unavailable");
    return {
      status:    degraded ? "degraded" as const : "ok" as const,
      version:   "1.2.3",
      timestamp: new Date().toISOString(),
      checks,
    };
  });

  // POST /execute ────────────────────────────────────────────────────────────

  registerExecuteRoute(app, { signer, verifier, auditDb });

  // POST /verify ─────────────────────────────────────────────────────────────

  registerVerifyRoute(app, { verifier, runtimeManifest, auditDb });

  // GET /audit/* (only when an audit database is configured) ─────────────────

  if (auditDb) {
    registerAuditRoutes(app, auditDb);
  }

  // ── 501 stubs ──────────────────────────────────────────────────────────────

  const stub = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.code(501).send({ error: "Not implemented" });
  };

  app.get("/runtime/manifest", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Runtime"],
      summary: "Runtime bundle manifest",
      description: "Returns the signed bundle manifest for the active governance runtime.",
      security: [{ bearerAuth: [] }],
      response: { 501: { description: "Not yet implemented", ...S_NOT_IMPLEMENTED } },
    },
  }, stub);

  app.get("/runtime/capabilities", {
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Runtime"],
      summary: "Runtime capability declarations",
      description: "Lists the capabilities supported by this runtime instance.",
      security: [{ bearerAuth: [] }],
      response: { 501: { description: "Not yet implemented", ...S_NOT_IMPLEMENTED } },
    },
  }, stub);

  app.post("/evaluate", {
    bodyLimit: 65536,
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Execution"],
      summary: "Evaluate a policy without executing",
      description: "Dry-run policy evaluation — computes a decision without issuing an attestation or consuming a replay slot.",
      security: [{ bearerAuth: [] }],
      body: { type: "object" },
      response: { 501: { description: "Not yet implemented", ...S_NOT_IMPLEMENTED } },
    },
  }, stub);

  app.post("/simulate", {
    bodyLimit: 65536,
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    schema: {
      tags: ["Execution"],
      summary: "Simulate a governance decision dry-run",
      description: "Runs the full execution pipeline in simulation mode — no side effects, no attestation produced.",
      security: [{ bearerAuth: [] }],
      body: { type: "object" },
      response: { 501: { description: "Not yet implemented", ...S_NOT_IMPLEMENTED } },
    },
  }, stub);
}
