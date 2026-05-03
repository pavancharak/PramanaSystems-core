import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Fastify pre-handler hook that enforces Bearer token authentication.
 *
 * When `PRAMANA_API_KEY` is set in the environment, every request must supply
 * the header `Authorization: Bearer <key>`.  If the key is absent or wrong the
 * hook sends `401 Unauthorized` and terminates the request.
 *
 * When `PRAMANA_API_KEY` is unset (dev mode), all requests pass through
 * without authentication.
 */
export async function authHook(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = process.env.PRAMANA_API_KEY;
  if (!apiKey) return; // dev mode — skip auth

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${apiKey}`) {
    req.log.warn({ reqId: req.id, reason: "auth_failure" }, "auth_failure");
    reply.code(401).send({ error: "Unauthorized" });
  }
}
