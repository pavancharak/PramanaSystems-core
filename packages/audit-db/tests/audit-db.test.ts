import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditDb } from "../src/client.js";

// ── pg mock ───────────────────────────────────────────────────────────────────
// vi.hoisted ensures these variables exist before vi.mock factories and before
// module imports are resolved, so the MockPool class can close over them.

const mocks = vi.hoisted(() => ({
  query:       vi.fn().mockResolvedValue({ rows: [] }),
  end:         vi.fn().mockResolvedValue(undefined),
  release:     vi.fn(),
  clientQuery: vi.fn().mockResolvedValue({}),
  connect:     vi.fn(),
}));

vi.mock("pg", () => {
  class MockPool {
    query   = mocks.query;
    connect = mocks.connect;
    end     = mocks.end;
  }
  return { Pool: MockPool, default: { Pool: MockPool } };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATTESTATION = {
  result: {
    execution_id:    "11111111-1111-1111-1111-111111111111",
    policy_id:       "access-control",
    policy_version:  "1.0.0",
    schema_version:  "1.0.0",
    runtime_version: "1.0.0",
    runtime_hash:    "abc123",
    decision:        "approve",
    signals_hash:    "deadbeef",
    executed_at:     "2026-05-03T00:00:00.000Z",
  },
  signature: "base64sig==",
};

const VERIFICATION_RESULT = {
  valid: true,
  checks: {
    signature_verified: true,
    runtime_verified:   true,
    schema_compatible:  true,
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuditDb", () => {
  let db: AuditDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.end.mockResolvedValue(undefined);
    mocks.clientQuery.mockResolvedValue({});
    mocks.connect.mockResolvedValue({
      query:   mocks.clientQuery,
      release: mocks.release,
    });
    db = new AuditDb("postgresql://pramana:pass@localhost:5432/audit");
  });

  // ── Fire-and-forget write methods ───────────────────────────────────────────

  it("recordDecision fires pool.query and returns void", () => {
    const result = db.recordDecision(ATTESTATION);
    expect(result).toBeUndefined();
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_decisions"),
      expect.arrayContaining([
        ATTESTATION.result.execution_id,
        ATTESTATION.result.policy_id,
        ATTESTATION.signature,
      ]),
    );
  });

  it("recordDecision does not throw when query rejects", async () => {
    mocks.query.mockRejectedValueOnce(new Error("db down"));
    expect(() => db.recordDecision(ATTESTATION)).not.toThrow();
    await new Promise(r => setTimeout(r, 0));
  });

  it("recordVerification fires pool.query and returns void", () => {
    const result = db.recordVerification(
      ATTESTATION.result.execution_id,
      VERIFICATION_RESULT,
    );
    expect(result).toBeUndefined();
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_verifications"),
      expect.arrayContaining([ATTESTATION.result.execution_id, true]),
    );
  });

  it("recordVerification does not throw when query rejects", async () => {
    mocks.query.mockRejectedValueOnce(new Error("db down"));
    expect(() =>
      db.recordVerification(ATTESTATION.result.execution_id, VERIFICATION_RESULT),
    ).not.toThrow();
    await new Promise(r => setTimeout(r, 0));
  });

  it("recordSecurityEvent fires pool.query and returns void", () => {
    const result = db.recordSecurityEvent({
      event_type: "auth_failure",
      severity:   "medium",
      ip_address: "127.0.0.1",
      path:       "/execute",
      method:     "POST",
    });
    expect(result).toBeUndefined();
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_security_events"),
      expect.arrayContaining(["auth_failure", "medium"]),
    );
  });

  it("recordSecurityEvent serialises details to JSON", () => {
    db.recordSecurityEvent({
      event_type: "replay_attempt",
      severity:   "high",
      details:    { execution_id: "abc" },
    });
    const callArgs = mocks.query.mock.calls[0][1] as unknown[];
    expect(callArgs[6]).toBe(JSON.stringify({ execution_id: "abc" }));
  });

  it("recordApiAccess fires pool.query and returns void", () => {
    const result = db.recordApiAccess({
      method:           "POST",
      path:             "/execute",
      status_code:      200,
      response_time_ms: 42,
    });
    expect(result).toBeUndefined();
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO audit_api_access"),
      expect.arrayContaining(["POST", "/execute", 200, 42]),
    );
  });

  it("recordApiAccess maps undefined optional fields to null", () => {
    db.recordApiAccess({ method: "GET", path: "/health", status_code: 200 });
    const params = mocks.query.mock.calls[0][1] as unknown[];
    expect(params[3]).toBeNull(); // response_time_ms
    expect(params[4]).toBeNull(); // ip_address
    expect(params[5]).toBeNull(); // user_agent
    expect(params[6]).toBeNull(); // execution_id
  });

  // ── Read methods ────────────────────────────────────────────────────────────

  it("getDecisionTimeline returns rows from view", async () => {
    const fakeRows = [{ execution_id: "abc", decision: "approve" }];
    mocks.query.mockResolvedValueOnce({ rows: fakeRows });
    const rows = await db.getDecisionTimeline(50);
    expect(rows).toEqual(fakeRows);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("view_decision_timeline"),
      [50],
    );
  });

  it("getDecisionTimeline defaults limit to 100", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    await db.getDecisionTimeline();
    expect(mocks.query).toHaveBeenCalledWith(expect.anything(), [100]);
  });

  it("getDecisionById returns the first row", async () => {
    const fakeRow = { execution_id: "abc", policy_id: "pol" };
    mocks.query.mockResolvedValueOnce({ rows: [fakeRow] });
    const result = await db.getDecisionById("abc");
    expect(result).toEqual(fakeRow);
  });

  it("getDecisionById returns null when no rows", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    const result = await db.getDecisionById("unknown");
    expect(result).toBeNull();
  });

  it("getVerificationsByExecution returns rows", async () => {
    const fakeRows = [{ id: 1, valid: true }];
    mocks.query.mockResolvedValueOnce({ rows: fakeRows });
    const rows = await db.getVerificationsByExecution("abc");
    expect(rows).toEqual(fakeRows);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("audit_verifications"),
      ["abc"],
    );
  });

  it("getSecurityDashboard returns rows", async () => {
    const fakeRows = [{ event_type: "auth_failure", event_count: "5" }];
    mocks.query.mockResolvedValueOnce({ rows: fakeRows });
    const rows = await db.getSecurityDashboard();
    expect(rows).toEqual(fakeRows);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("view_security_dashboard"),
    );
  });

  // ── migrate ─────────────────────────────────────────────────────────────────

  it("migrate connects, runs BEGIN/schema SQL/COMMIT, releases", async () => {
    await db.migrate();
    expect(mocks.connect).toHaveBeenCalledOnce();
    expect(mocks.clientQuery).toHaveBeenCalledTimes(3);
    expect(mocks.clientQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mocks.clientQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("CREATE TABLE IF NOT EXISTS audit_decisions"),
    );
    expect(mocks.clientQuery).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("migrate releases client even when schema query throws", async () => {
    mocks.clientQuery
      .mockResolvedValueOnce({})                           // BEGIN
      .mockRejectedValueOnce(new Error("syntax error"))    // schema SQL
      .mockResolvedValueOnce({});                          // ROLLBACK
    await expect(db.migrate()).rejects.toThrow("syntax error");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  // ── close ───────────────────────────────────────────────────────────────────

  it("close calls pool.end", async () => {
    await db.close();
    expect(mocks.end).toHaveBeenCalledOnce();
  });
});
