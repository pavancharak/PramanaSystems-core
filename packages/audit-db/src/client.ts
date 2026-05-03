import { Pool } from "pg";
import type { PoolClient } from "pg";

import type { ExecutionAttestation } from "@pramanasystems/execution";
import type { VerificationResult } from "@pramanasystems/verifier";

import type {
  AuditDecision,
  AuditVerification,
  SecurityEventInput,
  ApiAccessInput,
  DecisionTimelineRow,
  DecisionFilter,
  SecurityDashboardRow,
  AuditStats,
} from "./types.js";
import { runMigrations } from "./migrations.js";

export class AuditDb {
  private readonly pool: InstanceType<typeof Pool>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async migrate(): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      await runMigrations(client);
    } finally {
      client.release();
    }
  }

  /** Fire-and-forget — never throws, never delays the caller. */
  recordDecision(attestation: ExecutionAttestation): void {
    const { result, signature } = attestation;
    this.pool
      .query(
        `INSERT INTO audit_decisions
          (execution_id, policy_id, policy_version, schema_version, runtime_version,
           runtime_hash, decision, signals_hash, signature, attestation, executed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (execution_id) DO NOTHING`,
        [
          result.execution_id,
          result.policy_id,
          result.policy_version,
          result.schema_version,
          result.runtime_version,
          result.runtime_hash,
          result.decision,
          result.signals_hash,
          signature,
          JSON.stringify(attestation),
          result.executed_at,
        ],
      )
      .catch(() => undefined);
  }

  /** Fire-and-forget — never throws, never delays the caller. */
  recordVerification(executionId: string, result: VerificationResult): void {
    this.pool
      .query(
        `INSERT INTO audit_verifications
          (execution_id, valid, signature_verified, runtime_verified, schema_compatible)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          executionId,
          result.valid,
          result.checks.signature_verified,
          result.checks.runtime_verified,
          result.checks.schema_compatible,
        ],
      )
      .catch(() => undefined);
  }

  /** Fire-and-forget — never throws, never delays the caller. */
  recordSecurityEvent(event: SecurityEventInput): void {
    this.pool
      .query(
        `INSERT INTO audit_security_events
          (event_type, severity, ip_address, path, method, user_agent, details)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          event.event_type,
          event.severity,
          event.ip_address ?? null,
          event.path ?? null,
          event.method ?? null,
          event.user_agent ?? null,
          event.details != null ? JSON.stringify(event.details) : null,
        ],
      )
      .catch(() => undefined);
  }

  /** Fire-and-forget — never throws, never delays the caller. */
  recordApiAccess(access: ApiAccessInput): void {
    this.pool
      .query(
        `INSERT INTO audit_api_access
          (method, path, status_code, response_time_ms, ip_address, user_agent, execution_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          access.method,
          access.path,
          access.status_code,
          access.response_time_ms ?? null,
          access.ip_address ?? null,
          access.user_agent ?? null,
          access.execution_id ?? null,
        ],
      )
      .catch(() => undefined);
  }

  async getDecisionTimeline(limit = 100, filter?: DecisionFilter): Promise<DecisionTimelineRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filter?.policy_id) {
      values.push(filter.policy_id);
      conditions.push(`policy_id = $${values.length}`);
    }
    if (filter?.decision) {
      values.push(filter.decision);
      conditions.push(`decision = $${values.length}`);
    }
    if (filter?.from_date) {
      values.push(filter.from_date);
      conditions.push(`executed_at >= $${values.length}`);
    }
    if (filter?.to_date) {
      values.push(filter.to_date);
      conditions.push(`executed_at <= $${values.length}`);
    }

    values.push(limit);
    const limitParam = `$${values.length}`;
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await this.pool.query<DecisionTimelineRow>(
      `SELECT * FROM view_decision_timeline ${where} ORDER BY executed_at DESC LIMIT ${limitParam}`,
      values,
    );
    return rows;
  }

  async getStats(): Promise<AuditStats> {
    const { rows } = await this.pool.query<AuditStats>(`
      SELECT
        (SELECT COUNT(*) FROM audit_decisions)::text                                          AS total_decisions,
        (SELECT COUNT(*) FROM audit_decisions WHERE executed_at >= CURRENT_DATE)::text        AS decisions_today,
        (SELECT COUNT(*) FROM audit_verifications)::text                                      AS total_verifications,
        (SELECT COUNT(*) FROM audit_verifications WHERE valid = true)::text                   AS valid_verifications,
        (SELECT COUNT(*) FROM audit_verifications WHERE valid = false)::text                  AS invalid_verifications,
        (SELECT COUNT(*) FROM audit_security_events)::text                                    AS total_security_events,
        (SELECT COUNT(*) FROM audit_api_access)::text                                         AS total_api_calls
    `);
    return rows[0]!;
  }

  async getDecisionById(executionId: string): Promise<AuditDecision | null> {
    const { rows } = await this.pool.query<AuditDecision>(
      `SELECT * FROM audit_decisions WHERE execution_id = $1`,
      [executionId],
    );
    return rows[0] ?? null;
  }

  async getVerificationsByExecution(executionId: string): Promise<AuditVerification[]> {
    const { rows } = await this.pool.query<AuditVerification>(
      `SELECT * FROM audit_verifications
       WHERE execution_id = $1
       ORDER BY verified_at DESC`,
      [executionId],
    );
    return rows;
  }

  async getSecurityDashboard(): Promise<SecurityDashboardRow[]> {
    const { rows } = await this.pool.query<SecurityDashboardRow>(
      `SELECT * FROM view_security_dashboard ORDER BY event_count DESC`,
    );
    return rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
