import Fastify, { type FastifyInstance } from "fastify";
import { createHash, randomUUID } from "node:crypto";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";

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
export interface ServerInstance {
  app: FastifyInstance;
  auditDb?: AuditDb;
}

export function createServer(): ServerInstance {
  const app = Fastify({
    bodyLimit: 1048576, // 1 MB global default
    logger: {
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
      redact: {
        paths: [
          "req.headers.authorization",
          "req.body.signature",
          "req.body.attestation.signature",
        ],
        censor: "[REDACTED]",
      },
      serializers: {
        req(req) {
          const fwd = req.headers["x-forwarded-for"];
          return {
            method: req.method,
            url: req.url,
            reqId: req.id,
            remoteAddress: (Array.isArray(fwd) ? fwd[0] : fwd) ?? req.socket?.remoteAddress,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    },
    genReqId: (req: import("node:http").IncomingMessage) =>
      (req.headers["x-request-id"] as string | undefined) ?? randomUUID(),
  });

  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigin: string | string[] | boolean =
    corsOriginEnv === "*" ? true :
    corsOriginEnv         ? corsOriginEnv.split(",").map(o => o.trim()) :
                            ["http://localhost:5173", "http://localhost:8080"];

  app.register(cors, {
    origin:         corsOrigin,
    methods:        ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    credentials:    true,
    maxAge:         86400,
  });

  const auditDb = process.env.AUDIT_DATABASE_URL
    ? new AuditDb(process.env.AUDIT_DATABASE_URL)
    : undefined;

  if (auditDb) {
    auditDb.migrate().catch((err: unknown) =>
      app.log.error({ err }, "audit-db migration failed — continuing without audit persistence"),
    );
    app.addHook("onResponse", createAuditMiddleware(auditDb));
  }

  app.addHook("onSend", async (req, reply) => {
    reply.header("X-Request-ID", req.id);
  });

  app.addHook("preHandler", authHook);

  // Precompute API key hash once at startup — used as the per-key rate limit bucket
  const apiKeyHash = process.env.PRAMANA_API_KEY
    ? createHash("sha256").update(process.env.PRAMANA_API_KEY).digest("hex")
    : null;

  app.register(rateLimit, {
    keyGenerator(req) {
      if (apiKeyHash) return apiKeyHash;
      const forwarded = req.headers["x-forwarded-for"];
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const forwardedIp = forwardedStr?.split(",")[0]?.trim();
      const realIp = req.headers["x-real-ip"];
      const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;
      return forwardedIp ?? realIpStr ?? req.ip;
    },
    errorResponseBuilder(_req, context) {
      return {
        error: "Rate limit exceeded",
        limit: context.max,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + Math.ceil(context.ttl / 1000),
      };
    },
  });

  registerRoutes(app, { signer, verifier, runtimeManifest, auditDb });

  return { app, auditDb };
}
