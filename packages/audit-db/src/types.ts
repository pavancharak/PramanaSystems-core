import type { ExecutionAttestation } from "@pramanasystems/execution";
import type { VerificationResult } from "@pramanasystems/verifier";

export type { ExecutionAttestation, VerificationResult };

export interface AuditDecision {
  id: number;
  execution_id: string;
  policy_id: string;
  policy_version: string;
  schema_version: string;
  runtime_version: string;
  runtime_hash: string;
  decision: string;
  signals_hash: string;
  signature: string;
  attestation: ExecutionAttestation;
  executed_at: Date;
  recorded_at: Date;
}

export interface AuditVerification {
  id: number;
  execution_id: string;
  valid: boolean;
  signature_verified: boolean;
  runtime_verified: boolean;
  schema_compatible: boolean;
  verified_at: Date;
}

export type SecurityEventSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEventInput {
  event_type: string;
  severity: SecurityEventSeverity;
  ip_address?: string;
  path?: string;
  method?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

export interface AuditSecurityEvent extends SecurityEventInput {
  id: number;
  occurred_at: Date;
}

export interface ApiAccessInput {
  method: string;
  path: string;
  status_code: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  execution_id?: string;
}

export interface AuditApiAccess extends ApiAccessInput {
  id: number;
  accessed_at: Date;
}

export interface DecisionTimelineRow {
  execution_id: string;
  policy_id: string;
  policy_version: string;
  decision: string;
  runtime_version: string;
  runtime_hash: string;
  executed_at: Date;
  recorded_at: Date;
  verification_valid: boolean | null;
  signature_verified: boolean | null;
  runtime_verified: boolean | null;
  schema_compatible: boolean | null;
  verified_at: Date | null;
}

export interface SecurityDashboardRow {
  event_type: string;
  severity: string;
  /** pg returns BIGINT as string */
  event_count: string;
  last_occurrence: Date;
  first_occurrence: Date;
}
