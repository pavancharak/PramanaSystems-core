# @pramanasystems/server

Fastify REST API server for the PramanaSystems deterministic governance runtime.

[![npm](https://img.shields.io/npm/v/@pramanasystems/server)](https://www.npmjs.com/package/@pramanasystems/server)

---

## Overview

`@pramanasystems/server` is an HTTP wrapper over `@pramanasystems/execution`. It exposes the governance execution pipeline over a REST API so that any language or platform can execute and independently verify governance decisions without embedding the TypeScript SDK directly.

---

## Installation

```bash
npm install @pramanasystems/server
```

---

## Quick start

```bash
# Start with default ephemeral Ed25519 keypair (development)
npx pramana-server

# Start with persistent keys from environment variables
PRAMANA_PRIVATE_KEY="$(cat private.pem)" PRAMANA_PUBLIC_KEY="$(cat public.pem)" npx pramana-server

# Enable API key authentication
PRAMANA_API_KEY=my-secret-key npx pramana-server
```

The server listens on `http://0.0.0.0:3000` by default.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `3000`) |
| `HOST` | No | Bind address (default: `0.0.0.0`) |
| `PRAMANA_API_KEY` | No | When set, all routes require `Authorization: Bearer <key>` |
| `PRAMANA_PRIVATE_KEY` | No | PEM-encoded Ed25519 private key for signing |
| `PRAMANA_PUBLIC_KEY` | No | PEM-encoded Ed25519 public key for verification |

When `PRAMANA_PRIVATE_KEY` and `PRAMANA_PUBLIC_KEY` are absent, the server generates an ephemeral Ed25519 keypair on startup. This is suitable for development but means attestations cannot be verified after a restart.

---

## API routes

### `GET /health`

Returns runtime status and version.

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-05-02T10:00:00.000Z"
}
```

---

### `POST /execute`

Runs the deterministic governance runtime and returns a signed `ExecutionAttestation`.

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id":      "loan-approval",
    "policy_version": "v1",
    "decision_type":  "approve",
    "signals_hash":   "abc123signals"
  }'
```

```json
{
  "result": {
    "execution_id":    "550e8400-e29b-41d4-a716-446655440000",
    "policy_id":       "loan-approval",
    "policy_version":  "v1",
    "schema_version":  "1.0.0",
    "runtime_version": "1.0.0",
    "runtime_hash":    "a1b2c3...",
    "decision":        "approve",
    "signals_hash":    "abc123signals",
    "executed_at":     "2025-05-02T10:00:00.000Z"
  },
  "signature": "base64-encoded-Ed25519-signature"
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Missing required fields |
| `422` | Execution failed (token expired, replay detected, etc.) |

---

### `POST /verify`

Independently verifies an `ExecutionAttestation`. Pass the response from `POST /execute` directly.

```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{ "result": { ... }, "signature": "..." }'
```

```json
{
  "valid": true,
  "checks": {
    "signature_verified": true,
    "runtime_verified":   true,
    "schema_compatible":  true
  }
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Malformed attestation body |
| `422` | Verification threw an unexpected error |

---

### Stub endpoints (501 Not Implemented)

These endpoints are defined in the OpenAPI spec and will be implemented in future releases:

| Endpoint | Description |
|---|---|
| `GET /runtime/manifest` | Returns the signed bundle manifest for the active runtime |
| `GET /runtime/capabilities` | Lists runtime capabilities |
| `POST /evaluate` | Dry-run policy evaluation without attestation |
| `POST /simulate` | Full simulation mode — no side effects |

---

## Rate limits

All routes are rate-limited per API key (when `PRAMANA_API_KEY` is set) or per client IP (in dev mode).

| Route | Limit |
|---|---|
| `POST /execute` | 100 req/min |
| `POST /verify` | 200 req/min |
| `GET /audit/*` | 60 req/min |
| `GET /health` | 300 req/min |
| `GET /runtime/*` | 60 req/min |
| `POST /evaluate` | 60 req/min |
| `POST /simulate` | 60 req/min |

When authenticated, the rate limit key is `sha256(PRAMANA_API_KEY)`. In dev mode (no `PRAMANA_API_KEY`), the key falls back to `X-Forwarded-For` → `X-Real-IP` → socket IP.

Every response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1714640460
```

**Payload size limits** (enforced independently of rate limits):

| Route | Max body |
|---|---|
| `POST /execute` | 64 KB |
| `POST /verify` | 64 KB |
| `POST /evaluate` | 64 KB |
| `POST /simulate` | 64 KB |
| All other routes | 1 MB (global default) |

Requests exceeding the limit receive `413 Payload Too Large`. GET routes carry no body so no limit applies.

When a rate limit is exceeded the server responds with `429 Too Many Requests`:

```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "remaining": 0,
  "reset": 1714640460
}
```

---

## Authentication

When `PRAMANA_API_KEY` is set, all requests must include:

```
Authorization: Bearer <your-api-key>
```

Requests without a valid bearer token receive `401 Unauthorized`.

When `PRAMANA_API_KEY` is unset, the auth hook is disabled. This is the default development mode.

---

## OpenAPI specification

The full OpenAPI 3.0.3 specification is available at [`openapi.json`](../../openapi.json) in the repository root.

To regenerate it:

```bash
npx tsx scripts/export-openapi.ts
```

---

## Programmatic usage

```ts
import { createServer } from "@pramanasystems/server";

const app = createServer();
await app.listen({ port: 3000, host: "0.0.0.0" });
```

---

## License

Apache-2.0
