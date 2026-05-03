-- PramanaSystems audit database schema
-- Idempotent: safe to run on an existing database.

-- ── Tables ─────────────────────────────────────────────────────────────────

-- Governance decisions: one row per successful POST /execute
CREATE TABLE IF NOT EXISTS audit_decisions (
  id              BIGSERIAL    PRIMARY KEY,
  execution_id    UUID         NOT NULL UNIQUE,
  policy_id       TEXT         NOT NULL,
  policy_version  TEXT         NOT NULL,
  schema_version  TEXT         NOT NULL,
  runtime_version TEXT         NOT NULL,
  runtime_hash    TEXT         NOT NULL,
  decision        TEXT         NOT NULL,
  signals_hash    TEXT         NOT NULL,
  signature       TEXT         NOT NULL,
  attestation     JSONB        NOT NULL,
  executed_at     TIMESTAMPTZ  NOT NULL,
  recorded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_decisions_policy_id
  ON audit_decisions (policy_id);
CREATE INDEX IF NOT EXISTS idx_audit_decisions_executed_at
  ON audit_decisions (executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_decisions_decision
  ON audit_decisions (decision);

-- Attestation verifications: one row per POST /verify call
CREATE TABLE IF NOT EXISTS audit_verifications (
  id                   BIGSERIAL    PRIMARY KEY,
  execution_id         UUID         NOT NULL,
  valid                BOOLEAN      NOT NULL,
  signature_verified   BOOLEAN      NOT NULL,
  runtime_verified     BOOLEAN      NOT NULL,
  schema_compatible    BOOLEAN      NOT NULL,
  verified_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_verifications_execution_id
  ON audit_verifications (execution_id);
CREATE INDEX IF NOT EXISTS idx_audit_verifications_valid
  ON audit_verifications (valid);
CREATE INDEX IF NOT EXISTS idx_audit_verifications_verified_at
  ON audit_verifications (verified_at DESC);

-- Security events: auth failures, replay attempts, malformed requests
CREATE TABLE IF NOT EXISTS audit_security_events (
  id           BIGSERIAL    PRIMARY KEY,
  event_type   TEXT         NOT NULL,
  severity     TEXT         NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  ip_address   TEXT,
  path         TEXT,
  method       TEXT,
  user_agent   TEXT,
  details      JSONB,
  occurred_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_security_events_event_type
  ON audit_security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_security_events_severity
  ON audit_security_events (severity);
CREATE INDEX IF NOT EXISTS idx_audit_security_events_occurred_at
  ON audit_security_events (occurred_at DESC);

-- API access log: every inbound HTTP request
CREATE TABLE IF NOT EXISTS audit_api_access (
  id               BIGSERIAL    PRIMARY KEY,
  method           TEXT         NOT NULL,
  path             TEXT         NOT NULL,
  status_code      INTEGER      NOT NULL,
  response_time_ms INTEGER,
  ip_address       TEXT,
  user_agent       TEXT,
  execution_id     UUID,
  accessed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_api_access_path
  ON audit_api_access (path);
CREATE INDEX IF NOT EXISTS idx_audit_api_access_status_code
  ON audit_api_access (status_code);
CREATE INDEX IF NOT EXISTS idx_audit_api_access_accessed_at
  ON audit_api_access (accessed_at DESC);

-- ── Views ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW view_decision_timeline AS
SELECT
  d.execution_id,
  d.policy_id,
  d.policy_version,
  d.decision,
  d.runtime_version,
  d.runtime_hash,
  d.executed_at,
  d.recorded_at,
  v.valid              AS verification_valid,
  v.signature_verified,
  v.runtime_verified,
  v.schema_compatible,
  v.verified_at
FROM  audit_decisions d
LEFT  JOIN audit_verifications v ON d.execution_id = v.execution_id;

CREATE OR REPLACE VIEW view_security_dashboard AS
SELECT
  event_type,
  severity,
  COUNT(*)         AS event_count,
  MAX(occurred_at) AS last_occurrence,
  MIN(occurred_at) AS first_occurrence
FROM  audit_security_events
GROUP BY event_type, severity;
