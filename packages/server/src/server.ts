import Fastify, { type FastifyInstance } from "fastify";

import { signer, verifier, runtimeManifest } from "./runtime.js";
import { authHook } from "./auth.js";
import { registerRoutes } from "./routes.js";
import { AuditDb } from "@pramanasystems/audit-db";
import { createAuditMiddleware } from "./middleware/audit.js";

/**
 * Creates and configures the PramanaSystems Fastify HTTP server.
 *
 * When `AUDIT_DATABASE_URL` is set the server additionally:
 * - Runs schema migrations on startup (non-blocking; logs failure and continues).
 * - Fires an `onResponse` hook that records every request to `audit_api_access`
 *   and auth failures to `audit_security_events` — both fire-and-forget.
 * - Records each `/execute` decision and `/verify` result fire-and-forget.
 * - Exposes four read-only `/audit/*` query routes.
 *
 * Key points:
 * - The signer/verifier/runtimeManifest are resolved from environment variables,
 *   dev-keys on disk, or an ephemeral Ed25519 key pair in that order.
 * - Set `PRAMANA_API_KEY` to enable authentication; omit it for dev mode.
 */
export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const auditDb = process.env.AUDIT_DATABASE_URL
    ? new AuditDb(process.env.AUDIT_DATABASE_URL)
    : undefined;

  if (auditDb) {
    auditDb.migrate().catch((err: unknown) =>
      app.log.error({ err }, "audit-db migration failed — continuing without audit persistence"),
    );
    app.addHook("onResponse", createAuditMiddleware(auditDb));
  }

  app.addHook("preHandler", authHook);

  registerRoutes(app, { signer, verifier, runtimeManifest, auditDb });

  return app;
}
