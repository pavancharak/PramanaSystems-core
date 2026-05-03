# @pramanasystems/audit-db

PostgreSQL audit database client for PramanaSystems governance decisions, verifications, and security events.

## Overview

`audit-db` provides an `AuditDb` class that persists an immutable audit trail of every governance action. All write methods are **fire-and-forget** — they enqueue a database write and return immediately, so they never block or delay server responses.

The schema lives in PostgreSQL and is managed by the bundled `runMigrations()` function, which is idempotent and safe to run on every server startup.

## Schema

### Tables

| Table | Purpose |
|-------|---------|
| `audit_decisions` | One row per `POST /execute` — stores the full `ExecutionAttestation` as JSONB alongside extracted scalar fields for indexed queries. |
| `audit_verifications` | One row per `POST /verify` — records each check result (`signature_verified`, `runtime_verified`, `schema_compatible`). |
| `audit_security_events` | Auth failures, replay attempts, malformed requests. Severity: `low \| medium \| high \| critical`. |
| `audit_api_access` | Every inbound HTTP request with method, path, status code, and response time. |

### Views

| View | Purpose |
|------|---------|
| `view_decision_timeline` | `audit_decisions` LEFT JOINed to `audit_verifications` — one row per decision, with verification outcome if available. |
| `view_security_dashboard` | Security events aggregated by `(event_type, severity)` with counts and timestamps. |

## Installation

```bash
npm install @pramanasystems/audit-db
```

Requires `pg` (node-postgres) which is listed as a peer dependency.

## Quick start

```typescript
import { AuditDb } from "@pramanasystems/audit-db";

const db = new AuditDb(process.env.AUDIT_DATABASE_URL!);

// Run migrations once on startup (idempotent)
await db.migrate();

// Fire-and-forget writes (never await these in the request path)
db.recordDecision(attestation);
db.recordVerification(executionId, verificationResult);
db.recordSecurityEvent({ event_type: "auth_failure", severity: "medium", ip_address: req.ip });
db.recordApiAccess({ method: "POST", path: "/execute", status_code: 200, response_time_ms: 12 });

// Async reads
const timeline = await db.getDecisionTimeline(100);
const decision = await db.getDecisionById("11111111-...");
const verifications = await db.getVerificationsByExecution("11111111-...");
const dashboard = await db.getSecurityDashboard();

await db.close();
```

## Server integration

When `AUDIT_DATABASE_URL` is set, the PramanaSystems server automatically:

1. Runs `db.migrate()` on startup (logs failure, continues running).
2. Registers an `onResponse` Fastify hook that records every request and emits a security event for 401 responses.
3. Calls `db.recordDecision()` after each `POST /execute`.
4. Calls `db.recordVerification()` after each `POST /verify`.
5. Exposes four read-only audit routes:

| Route | Description |
|-------|-------------|
| `GET /audit/decisions?limit=N` | Decision timeline (max 1000, default 100) |
| `GET /audit/decisions/:executionId` | Single decision with full attestation JSONB |
| `GET /audit/security` | Security event dashboard |
| `GET /audit/verifications/:executionId` | All verification attempts for an execution |

## Docker Compose

The included `docker-compose.yml` wires up a `postgres:16-alpine` service and passes `AUDIT_DATABASE_URL` to the server automatically. Set `POSTGRES_PASSWORD` in `.env` before running:

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and other values
docker compose up
```

## API

### `new AuditDb(connectionString: string)`

Creates a new pool-backed audit client.

### `migrate(): Promise<void>`

Runs the schema SQL inside a transaction. Safe to call on every startup — all DDL uses `IF NOT EXISTS` / `CREATE OR REPLACE`.

### `recordDecision(attestation: ExecutionAttestation): void`

Fire-and-forget. Inserts the attestation into `audit_decisions`. Duplicate `execution_id` is silently ignored (`ON CONFLICT DO NOTHING`).

### `recordVerification(executionId: string, result: VerificationResult): void`

Fire-and-forget. Inserts the verification result into `audit_verifications`.

### `recordSecurityEvent(event: SecurityEventInput): void`

Fire-and-forget. Inserts into `audit_security_events`. `severity` must be `low | medium | high | critical`.

### `recordApiAccess(access: ApiAccessInput): void`

Fire-and-forget. Inserts into `audit_api_access`.

### `getDecisionTimeline(limit?: number): Promise<DecisionTimelineRow[]>`

Queries `view_decision_timeline`. Default limit 100.

### `getDecisionById(executionId: string): Promise<AuditDecision | null>`

Returns the full decision row including the raw `attestation` JSONB, or `null` if not found.

### `getVerificationsByExecution(executionId: string): Promise<AuditVerification[]>`

Returns all verification attempts for a given `execution_id`, newest first.

### `getSecurityDashboard(): Promise<SecurityDashboardRow[]>`

Returns `view_security_dashboard` rows, ordered by `event_count DESC`.

### `close(): Promise<void>`

Drains the connection pool. Call on graceful shutdown.

## License

Apache-2.0
