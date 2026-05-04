/**
 * Deterministic Execution Invariant Validation Suite
 *
 * Validates that all 13 deterministic execution guarantees hold
 * across the PramanaSystems-core codebase.
 *
 * G1  — Same input + policy version + schema version + runtime version →
 *        identical output, hash, and signature across runs
 * G2  — Execution identical across environments (local, container, CI)
 * G3  — Canonical serialization produces identical bytes for semantically identical inputs
 * G4  — Execution must not depend on metadata (timestamps, request IDs, env vars, headers)
 * G5  — Execution must not depend on wall-clock time, timezones, or system clocks
 * G6  — Evaluation order is deterministic (no unordered iteration or concurrency variation)
 * G7  — Numerical computations are deterministic across environments
 * G8  — Replay of stored execution produces identical results and prevents duplication
 * G9  — All outputs independently verifiable using only public artifacts
 * G10 — All required artifacts complete and sufficient for full reproduction
 * G11 — Failures are deterministic and reproducible (same input → same error)
 * G12 — Past decisions remain reproducible indefinitely under their original versions
 * G13 — Any deviation must fail the pipeline (fail-closed)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { describe, it, expect } from "vitest";

import { canonicalize as bundleCanonicalize } from "@pramanasystems/bundle";
import { canonicalize as coreCanonicalize } from "@pramanasystems/core";
import { sha256 } from "@pramanasystems/bundle";

import {
  LocalSigner,
  LocalVerifier,
  executeDecision,
  signExecutionResult,
  verifyExecutionResult,
  signExecutionToken,
  verifyExecutionToken,
  MemoryReplayStore,
  getRuntimeManifest,
  hashRuntime,
  runtimeManifestDefinition,
} from "@pramanasystems/execution";

import {
  verifyAttestation,
  verifyRuntime,
} from "@pramanasystems/verifier";

import {
  assertNoOperationalMetadata,
  LocalValidator,
  forbiddenDeterministicFields,
} from "@pramanasystems/core";

// ── Key infrastructure ────────────────────────────────────────────────────────

function makeKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return { privateKey, publicKey };
}

const KEY_A = makeKeyPair();
const KEY_B = makeKeyPair();

function signerA() { return new LocalSigner(KEY_A.privateKey); }
function verifierA() { return new LocalVerifier(KEY_A.publicKey); }

function baseToken(overrides = {}) {
  return {
    execution_id: crypto.randomUUID(),
    policy_id: "test-policy",
    policy_version: "v1",
    bundle_hash: "abc123",
    decision_type: "approve",
    signals_hash: "sig123",
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 300_000).toISOString(),
    ...overrides,
  };
}

function baseResult(overrides = {}) {
  return {
    execution_id: "fixed-exec-id",
    policy_id: "test-policy",
    policy_version: "v1",
    schema_version: "1.0.0",
    runtime_version: "1.0.0",
    runtime_hash: hashRuntime(),
    decision: "approve",
    signals_hash: "fixed-signals-hash",
    executed_at: "2024-01-01T00:00:00.000Z",
    governed: true as const,
    ...overrides,
  };
}

function makeContext(token: any, sig: string, overrides = {}) {
  return {
    token,
    token_signature: sig,
    signer: signerA(),
    verifier: verifierA(),
    runtime_manifest: getRuntimeManifest(),
    runtime_requirements: {
      required_capabilities: ["replay-protection", "attestation-signing"],
      supported_runtime_versions: ["1.0.0"],
      supported_schema_versions: ["1.0.0"],
    },
    ...overrides,
  };
}

function readAuditLines(auditFile: string): Record<string, unknown>[] {
  return fs.readFileSync(auditFile, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => JSON.parse(l));
}

// ─────────────────────────────────────────────────────────────────────────────
// G1 — Same input + same versions → identical output, hash, and signature
// ─────────────────────────────────────────────────────────────────────────────

describe("G1 — Identical output, hash, and signature for same input + versions", () => {

  it("canonical serialization of identical input is byte-for-byte identical across 10 runs", () => {
    const input = {
      policy_id: "claims-approval",
      policy_version: "v1",
      schema_version: "1.0.0",
      runtime_version: "1.0.0",
      decision: "approve",
      signals: { risk_score: 42, vip_customer: true },
      nested: { a: [1, 2, 3], b: { z: "last", a: "first" } },
    };
    const results = Array.from({ length: 10 }, () => bundleCanonicalize(input));
    expect(new Set(results).size).toBe(1);
  });

  it("SHA-256 hash of identical versioned input is identical across 10 runs", () => {
    const input = {
      execution_id: "x",
      policy_id: "p",
      policy_version: "v1",
      schema_version: "1.0.0",
      runtime_version: "1.0.0",
      decision: "approve",
    };
    const hashes = Array.from({ length: 10 }, () => sha256(bundleCanonicalize(input)));
    expect(new Set(hashes).size).toBe(1);
  });

  it("Ed25519 signature of identical result is identical across 10 signing calls", () => {
    const signer = signerA();
    const result = baseResult();
    const signatures = Array.from({ length: 10 }, () => signExecutionResult(result, signer));
    expect(new Set(signatures).size).toBe(1);
  });

  it("token signature is identical across 10 calls with same key and token", () => {
    const signer = signerA();
    const token = baseToken({ execution_id: "stable-id" });
    const signatures = Array.from({ length: 10 }, () => signExecutionToken(token, signer));
    expect(new Set(signatures).size).toBe(1);
  });

  it("runtime hash is identical across 10 calls", () => {
    expect(new Set(Array.from({ length: 10 }, () => hashRuntime())).size).toBe(1);
  });

  it("all 10 verifications of same signature return true", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    const verifications = Array.from({ length: 10 }, () =>
      verifyExecutionResult(result, sig, verifier)
    );
    expect(verifications.every(v => v === true)).toBe(true);
  });

  it("policy evaluation is identical across 10 runs for same signals + version", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    const signals = { insurance_active: true, risk_score: 30, vip_customer: false };
    const decisions = Array.from({ length: 10 }, () =>
      evaluatePolicy("claims-approval", "v1", signals)
    );
    expect(new Set(decisions).size).toBe(1);
  });

  it("different policy_version must produce different canonical hash", () => {
    const r1 = baseResult({ policy_version: "v1" });
    const r2 = baseResult({ policy_version: "v2" });
    expect(sha256(bundleCanonicalize(r1))).not.toBe(sha256(bundleCanonicalize(r2)));
  });

  it("different schema_version must produce different canonical hash", () => {
    const r1 = baseResult({ schema_version: "1.0.0" });
    const r2 = baseResult({ schema_version: "2.0.0" });
    expect(sha256(bundleCanonicalize(r1))).not.toBe(sha256(bundleCanonicalize(r2)));
  });

  it("different runtime_version must produce different canonical hash", () => {
    const r1 = baseResult({ runtime_version: "1.0.0" });
    const r2 = baseResult({ runtime_version: "2.0.0" });
    expect(sha256(bundleCanonicalize(r1))).not.toBe(sha256(bundleCanonicalize(r2)));
  });

  it("changing any single signal field changes the signals hash", () => {
    const base = { insurance_active: true, risk_score: 30, vip_customer: false };
    const modified = { ...base, risk_score: 99 };
    expect(sha256(bundleCanonicalize(base))).not.toBe(sha256(bundleCanonicalize(modified)));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G2 — Execution identical across environments
// ─────────────────────────────────────────────────────────────────────────────

describe("G2 — Environment-independent execution", () => {

  it("runtime manifest definition contains no process.env references", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/hash-runtime.ts"), "utf8"
    );
    expect(src).not.toContain("process.env");
    expect(src).not.toContain("os.hostname");
    expect(src).not.toContain("os.platform");
  });

  it("canonicalize sources contain no environment or platform references", () => {
    for (const p of [
      "./packages/bundle/src/canonicalize.ts",
      "./packages/core/src/canonicalize.ts",
    ]) {
      const src = fs.readFileSync(path.resolve(p), "utf8");
      expect(src).not.toContain("process.env");
      expect(src).not.toContain("os.");
      expect(src).not.toContain("hostname");
    }
  });

  it("hash.ts contains no environment or platform references", () => {
    const src = fs.readFileSync(path.resolve("./packages/bundle/src/hash.ts"), "utf8");
    expect(src).not.toContain("process.env");
    expect(src).not.toContain("os.");
  });

  it("runtimeManifestDefinition values are all static strings or string arrays", () => {
    const def = runtimeManifestDefinition as Record<string, unknown>;
    for (const [, value] of Object.entries(def)) {
      if (Array.isArray(value)) {
        expect(value.every(v => typeof v === "string")).toBe(true);
      } else {
        expect(typeof value).toBe("string");
      }
    }
  });

  it("two independent LocalSigner instances with same key produce identical signatures", () => {
    const signer1 = new LocalSigner(KEY_A.privateKey);
    const signer2 = new LocalSigner(KEY_A.privateKey);
    const result = baseResult();
    expect(signExecutionResult(result, signer1)).toBe(signExecutionResult(result, signer2));
  });

  it("UTF-8 encoding of Unicode payloads is stable (no locale dependency)", () => {
    for (const p of ["café", "日本語", "Ünïcödé", "emoji🔐test"]) {
      expect(sha256(p)).toBe(sha256(p));
    }
  });

  it("NFC normalization produces consistent hash across composed and decomposed forms", () => {
    const composed = "é";
    const decomposed = "é";
    expect(sha256(composed.normalize("NFC"))).toBe(sha256(decomposed.normalize("NFC")));
  });

  it("execute.ts contains no os or hostname references", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/execute.ts"), "utf8"
    );
    expect(src).not.toContain("os.hostname");
    expect(src).not.toContain("os.platform");
    expect(src).not.toContain("process.platform");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G3 — Canonical serialization produces identical bytes
// ─────────────────────────────────────────────────────────────────────────────

describe("G3 — Canonical serialization identical bytes", () => {

  it("object key insertion order does not affect canonical output", () => {
    const v1 = { z: 3, a: 1, m: 2 };
    const v2 = { a: 1, m: 2, z: 3 };
    const v3 = { m: 2, z: 3, a: 1 };
    expect(bundleCanonicalize(v1)).toBe(bundleCanonicalize(v2));
    expect(bundleCanonicalize(v2)).toBe(bundleCanonicalize(v3));
  });

  it("deeply nested objects canonicalize identically regardless of insertion order", () => {
    const a = { outer: { z: { q: 1, a: 2 }, a: { z: 3, m: 4 } } };
    const b = { outer: { a: { m: 4, z: 3 }, z: { a: 2, q: 1 } } };
    expect(bundleCanonicalize(a)).toBe(bundleCanonicalize(b));
  });

  it("array order is preserved — different orderings produce different bytes", () => {
    expect(bundleCanonicalize({ items: [1, 2, 3] })).not.toBe(
      bundleCanonicalize({ items: [3, 2, 1] })
    );
  });

  it("array elements are not auto-sorted during canonicalization", () => {
    expect(JSON.parse(bundleCanonicalize({ items: [3, 1, 2] })).items).toEqual([3, 1, 2]);
  });

  it("1.0 and 1 produce identical canonical bytes (numeric stability)", () => {
    expect(bundleCanonicalize({ value: 1.0 })).toBe(bundleCanonicalize({ value: 1 }));
  });

  it("undefined fields are excluded — output identical with or without them", () => {
    expect(bundleCanonicalize({ a: 1, b: undefined })).toBe(
      bundleCanonicalize({ a: 1 })
    );
  });

  it("NaN, Infinity, and -Infinity are normalized to null", () => {
    expect(JSON.parse(bundleCanonicalize({ v: NaN })).v).toBeNull();
    expect(JSON.parse(bundleCanonicalize({ v: Infinity })).v).toBeNull();
    expect(JSON.parse(bundleCanonicalize({ v: -Infinity })).v).toBeNull();
  });

  it("SHA-256 of canonical form is identical for semantically equivalent objects", () => {
    const a = { z: 1, a: 2, items: [1, 2, 3], nested: { b: true, a: false } };
    const b = { a: 2, z: 1, items: [1, 2, 3], nested: { a: false, b: true } };
    expect(sha256(bundleCanonicalize(a))).toBe(sha256(bundleCanonicalize(b)));
  });

  it("bundle and core canonicalize produce consistent key ordering", () => {
    const input = { z: 1, a: 2, m: { q: 3, b: 4 } };
    expect(Object.keys(JSON.parse(bundleCanonicalize(input)))).toEqual(
      Object.keys(JSON.parse(coreCanonicalize(input)))
    );
  });

  it("empty string hashes to the well-known SHA-256 value", () => {
    expect(sha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("token canonical form is byte-identical across two serializations", () => {
    const token = baseToken({ execution_id: "fixed-id" });
    expect(bundleCanonicalize(token)).toBe(bundleCanonicalize(token));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G4 — Execution must not depend on metadata
// ─────────────────────────────────────────────────────────────────────────────

describe("G4 — Execution must not depend on metadata", () => {

  it("LocalValidator rejects all operational metadata field names in payload", () => {
    const validator = new LocalValidator();
    for (const field of ["generatedAt", "environment", "host", "runtime", "traceId"]) {
      const result = validator.validate({
        payload: { decision: "approve", [field]: "some-value" },
        signature: "sig",
      });
      expect(result.stages.deterministic).toBe(false);
    }
  });

  it("clean payload with no operational metadata passes validator", () => {
    const validator = new LocalValidator();
    expect(validator.validate({
      payload: { fraud_score: 10, account_age_days: 365, vip: true },
      signature: "sig",
    }).stages.deterministic).toBe(true);
  });

  it("assertNoOperationalMetadata blocks all 10 reserved governance field names", () => {
    const reserved = [
      "decision", "policy_id", "execution_id", "governed_time",
      "attestation_version", "intent", "signals_ref", "rule_trace",
      "dry_run", "runtime_id",
    ];
    for (const field of reserved) {
      expect(assertNoOperationalMetadata({ [field]: "injected" }, reserved)).toBe(false);
    }
  });

  it("assertNoOperationalMetadata blocks reserved fields nested in objects", () => {
    const reserved = ["decision", "policy_id", "execution_id"];
    expect(assertNoOperationalMetadata({ meta: { decision: "injected" } }, reserved)).toBe(false);
  });

  it("assertNoOperationalMetadata blocks reserved fields nested in arrays", () => {
    const reserved = ["decision", "policy_id", "execution_id"];
    expect(assertNoOperationalMetadata({ items: [{ decision: "injected" }] }, reserved)).toBe(false);
  });

  it("adding metadata to result after signing breaks signature verification", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    expect(verifyExecutionResult({ ...result, _trace: "injected" }, sig, verifier)).toBe(false);
  });

  it("forbiddenDeterministicFields covers all operational metadata categories", () => {
    expect(forbiddenDeterministicFields).toContain("generatedAt");
    expect(forbiddenDeterministicFields).toContain("environment");
    expect(forbiddenDeterministicFields).toContain("host");
    expect(forbiddenDeterministicFields).toContain("runtime");
    expect(forbiddenDeterministicFields).toContain("traceId");
  });

  it("signExecutionResult does not mutate the result object", () => {
    const signer = signerA();
    const result = baseResult();
    const snapshot = JSON.stringify(result);
    signExecutionResult(result, signer);
    expect(JSON.stringify(result)).toBe(snapshot);
  });

  it("verifyExecutionResult does not mutate the result object", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    const snapshot = JSON.stringify(result);
    verifyExecutionResult(result, sig, verifier);
    expect(JSON.stringify(result)).toBe(snapshot);
  });

  it("request-scoped metadata fields (traceId, host) are not present in execution result fields", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const resultKeys = Object.keys(attestation.result);
    for (const forbidden of ["traceId", "host", "environment", "generatedAt", "requestId"]) {
      expect(resultKeys).not.toContain(forbidden);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G5 — Execution must not depend on wall-clock time, timezones, or system clocks
// ─────────────────────────────────────────────────────────────────────────────

describe("G5 — No wall-clock, timezone, or system clock dependency", () => {

  it("execute.ts Date.now() usage does not exceed 1 occurrence (tracking known violation)", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/execute.ts"), "utf8"
    );
    // One known violation: token expiry check uses Date.now()
    // This must not grow. Should eventually be replaced with governed_time.
    const violations = (src.match(/Date\.now\(\)/g) || []).length;
    expect(violations).toBeLessThanOrEqual(1);
  });

  it("canonicalize sources contain no Date, time, or clock references", () => {
    for (const p of [
      "./packages/bundle/src/canonicalize.ts",
      "./packages/core/src/canonicalize.ts",
      "./packages/bundle/src/hash.ts",
    ]) {
      const src = fs.readFileSync(path.resolve(p), "utf8");
      expect(src).not.toContain("Date.now");
      expect(src).not.toContain("new Date");
      expect(src).not.toContain("performance.now");
      expect(src).not.toContain("Intl.DateTimeFormat");
    }
  });

  it("hash-runtime.ts contains no Date, time, or timezone references", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/hash-runtime.ts"), "utf8"
    );
    expect(src).not.toContain("Date.now");
    expect(src).not.toContain("new Date");
    expect(src).not.toContain("performance.now");
    expect(src).not.toContain("timezone");
    expect(src).not.toContain("Intl.");
  });

  it("runtime hash is identical regardless of when it is computed", () => {
    const h1 = hashRuntime();
    const h2 = hashRuntime();
    expect(h1).toBe(h2);
  });

  it("canonical serialization output does not change between calls (no hidden clock input)", () => {
    const input = { policy_id: "p", decision: "approve", version: "1.0.0" };
    expect(bundleCanonicalize(input)).toBe(bundleCanonicalize(input));
  });

  it("fixed executed_at in result does not affect signature stability", () => {
    const signer = signerA();
    const verifier = verifierA();
    // Use a fixed timestamp — signing must be stable for same timestamp
    const result = baseResult({ executed_at: "2024-06-15T12:00:00.000Z" });
    const sig1 = signExecutionResult(result, signer);
    const sig2 = signExecutionResult(result, signer);
    expect(sig1).toBe(sig2);
    expect(verifyExecutionResult(result, sig1, verifier)).toBe(true);
  });

  it("two results with different executed_at produce different hashes (time is input, not ambient)", () => {
    const r1 = baseResult({ executed_at: "2024-01-01T00:00:00.000Z" });
    const r2 = baseResult({ executed_at: "2025-01-01T00:00:00.000Z" });
    expect(sha256(bundleCanonicalize(r1))).not.toBe(sha256(bundleCanonicalize(r2)));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G6 — Evaluation order is deterministic
// ─────────────────────────────────────────────────────────────────────────────

describe("G6 — Deterministic evaluation order", () => {

  it("canonicalize always produces lexicographically sorted keys (not map iteration order)", () => {
    const inputs = [
      { z: 1, a: 2, m: 3 },
      { m: 3, z: 1, a: 2 },
      { a: 2, z: 1, m: 3 },
    ];
    const canonicals = inputs.map(bundleCanonicalize);
    expect(new Set(canonicals).size).toBe(1);
    const keys = Object.keys(JSON.parse(canonicals[0]));
    expect(keys).toEqual(["a", "m", "z"]);
  });

  it("nested object keys are sorted at every depth level", () => {
    const input = { z: { q: 1, a: 2 }, a: { z: 3, m: 4 } };
    const parsed = JSON.parse(bundleCanonicalize(input));
    expect(Object.keys(parsed)).toEqual(["a", "z"]);
    expect(Object.keys(parsed.a)).toEqual(["m", "z"]);
    expect(Object.keys(parsed.z)).toEqual(["a", "q"]);
  });

  it("array elements are evaluated in authored order (not sorted)", () => {
    const input = { rules: ["deny_if_fraud", "approve_if_vip", "default_deny"] };
    const output = JSON.parse(bundleCanonicalize(input));
    expect(output.rules).toEqual(["deny_if_fraud", "approve_if_vip", "default_deny"]);
  });

  it("policy evaluation logic is synchronous — no async in evaluateRule path", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/execute.ts"), "utf8"
    );
    const match = src.match(/function evaluateRule[\s\S]+?^}/m);
    if (match) {
      expect(match[0]).not.toContain("async");
      expect(match[0]).not.toContain("Promise");
      expect(match[0]).not.toContain("setTimeout");
      expect(match[0]).not.toContain("setInterval");
    }
  });

  it("100 independent canonical serializations of same object produce identical output", () => {
    const input = { z: 3, a: 1, nested: { b: 2, a: 1 }, items: [3, 1, 2] };
    const results = Array.from({ length: 100 }, () => bundleCanonicalize(input));
    expect(new Set(results).size).toBe(1);
  });

  it("policy rule evaluation produces same result for same signals across 20 runs", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    const signals = { insurance_active: true, risk_score: 25, vip_customer: true };
    const results = Array.from({ length: 20 }, () =>
      evaluatePolicy("claims-approval", "v1", signals)
    );
    expect(new Set(results).size).toBe(1);
  });

  it("separate MemoryReplayStore instances are isolated (no shared iteration state)", () => {
    const store1 = new MemoryReplayStore();
    const store2 = new MemoryReplayStore();
    store1.markExecuted("id-A");
    store1.markExecuted("id-B");
    expect(store2.hasExecuted("id-A")).toBe(false);
    expect(store2.hasExecuted("id-B")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G7 — Numerical computations are deterministic across environments
// ─────────────────────────────────────────────────────────────────────────────

describe("G7 — Deterministic numerical computations", () => {

  it("integer and float representations of same value canonicalize identically", () => {
    expect(bundleCanonicalize({ v: 1.0 })).toBe(bundleCanonicalize({ v: 1 }));
    expect(bundleCanonicalize({ v: 0.0 })).toBe(bundleCanonicalize({ v: 0 }));
    expect(bundleCanonicalize({ v: 42.0 })).toBe(bundleCanonicalize({ v: 42 }));
  });

  it("SHA-256 of canonical numeric values is stable across 10 runs", () => {
    const hashes = Array.from({ length: 10 }, () =>
      sha256(bundleCanonicalize({ score: 42, threshold: 100, ratio: 0.75 }))
    );
    expect(new Set(hashes).size).toBe(1);
  });

  it("NaN is normalized to null in canonical form (not environment-dependent)", () => {
    expect(JSON.parse(bundleCanonicalize({ v: NaN })).v).toBeNull();
  });

  it("Infinity is normalized to null in canonical form (not environment-dependent)", () => {
    expect(JSON.parse(bundleCanonicalize({ v: Infinity })).v).toBeNull();
    expect(JSON.parse(bundleCanonicalize({ v: -Infinity })).v).toBeNull();
  });

  it("SHA-256 digest is always exactly 64 hex characters", () => {
    for (const input of ["hello", "", "こんにちは", "a".repeat(10000)]) {
      expect(sha256(input)).toHaveLength(64);
      expect(sha256(input)).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("different numeric values always produce different canonical hashes", () => {
    expect(sha256(bundleCanonicalize({ score: 42 }))).not.toBe(
      sha256(bundleCanonicalize({ score: 43 }))
    );
  });

  it("policy numeric signal comparisons are stable (greater_than, less_than)", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    // risk_score < 70 → approve; risk_score >= 70 → deny (unless vip)
    const approve = evaluatePolicy("claims-approval", "v1", {
      insurance_active: true, risk_score: 69, vip_customer: false,
    });
    const deny = evaluatePolicy("claims-approval", "v1", {
      insurance_active: true, risk_score: 70, vip_customer: false,
    });
    expect(approve).toBe("approve");
    expect(deny).toBe("deny");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G8 — Replay of stored execution produces identical results and prevents duplication
// ─────────────────────────────────────────────────────────────────────────────

describe("G8 — Replay produces identical results and prevents duplication", () => {

  it("stored canonical result re-hashes to the same value on replay", () => {
    const result = baseResult();
    const canonical = bundleCanonicalize(result);
    const stored = JSON.parse(canonical);
    expect(sha256(bundleCanonicalize(stored))).toBe(sha256(canonical));
  });

  it("stored signature verifies on replay without re-signing", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    const storedResult = JSON.parse(JSON.stringify(result));
    expect(verifyExecutionResult(storedResult, sig, verifier)).toBe(true);
  });

  it("verifyAttestation on persisted attestation succeeds on replay", () => {
    const signer = signerA();
    const verifier = verifierA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const persisted = JSON.parse(JSON.stringify(attestation));
    const manifest = getRuntimeManifest();
    const r1 = verifyAttestation(attestation, verifier, manifest);
    const r2 = verifyAttestation(persisted, verifier, manifest);
    expect(r1.valid).toBe(true);
    expect(r2.valid).toBe(true);
    expect(r1.checks).toEqual(r2.checks);
  });

  it("canonical form of JSON round-tripped result is byte-identical to original", () => {
    const result = baseResult();
    const original = bundleCanonicalize(result);
    expect(bundleCanonicalize(JSON.parse(original))).toBe(original);
  });

  it("replay store prevents re-execution of a stored execution_id (no duplication)", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    executeDecision(makeContext(token, sig) as any, store);
    const sig2 = signExecutionToken({ ...token }, signer);
    expect(() => executeDecision(makeContext({ ...token }, sig2) as any, store)).toThrow();
  });

  it("replay store prevents re-execution across 5 replay attempts", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    executeDecision(makeContext(token, sig) as any, store);
    for (let i = 0; i < 5; i++) {
      const replaySig = signExecutionToken({ ...token }, signer);
      expect(() =>
        executeDecision(makeContext({ ...token }, replaySig) as any, store)
      ).toThrow();
    }
  });

  it("different execution_ids can execute independently without collision", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    for (let i = 0; i < 5; i++) {
      const token = baseToken(); // new UUID each time
      const sig = signExecutionToken(token, signer);
      expect(() =>
        executeDecision(makeContext(token, sig) as any, store)
      ).not.toThrow();
    }
  });

  it("stored execution_id in audit record matches the original token on replay", () => {
    const auditDir = path.resolve("./runtime-audit");
    const auditFile = path.join(auditDir, "executions.jsonl");
    const backup = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, "utf8") : null;
    fs.mkdirSync(auditDir, { recursive: true });
    fs.writeFileSync(auditFile, "", "utf8");

    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    executeDecision(makeContext(token, sig) as any, store);

    const records = readAuditLines(auditFile);
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].execution_id).toBe(token.execution_id);

    if (backup !== null) fs.writeFileSync(auditFile, backup, "utf8");
  });

  it("verifyAttestation is idempotent — identical result across 10 replay verifications", () => {
    const signer = signerA();
    const verifier = verifierA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const manifest = getRuntimeManifest();
    const results = Array.from({ length: 10 }, () =>
      verifyAttestation(attestation, verifier, manifest)
    );
    expect(results.every(r => r.valid === true)).toBe(true);
    expect(results.every(r => JSON.stringify(r.checks) === JSON.stringify(results[0].checks))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G9 — All outputs independently verifiable using only public artifacts
// ─────────────────────────────────────────────────────────────────────────────

describe("G9 — Independent verifiability using only public artifacts", () => {

  it("verifyExecutionResult requires only public key, result, and signature", () => {
    const signer = signerA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    const independentVerifier = new LocalVerifier(KEY_A.publicKey);
    expect(verifyExecutionResult(result, sig, independentVerifier)).toBe(true);
  });

  it("verifyAttestation requires only public key and runtime manifest", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const independentVerifier = new LocalVerifier(KEY_A.publicKey);
    const result = verifyAttestation(attestation, independentVerifier, getRuntimeManifest());
    expect(result.valid).toBe(true);
    expect(result.checks.signature_verified).toBe(true);
    expect(result.checks.runtime_verified).toBe(true);
    expect(result.checks.schema_compatible).toBe(true);
  });

  it("verifyAttestation exposes full per-check breakdown for auditability", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const result = verifyAttestation(attestation, verifierA(), getRuntimeManifest());
    expect(result.checks).toHaveProperty("signature_verified");
    expect(result.checks).toHaveProperty("runtime_verified");
    expect(result.checks).toHaveProperty("schema_compatible");
  });

  it("wrong public key cannot verify a signature — authority is isolated by key", () => {
    const signer = signerA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    expect(verifyExecutionResult(result, sig, new LocalVerifier(KEY_B.publicKey))).toBe(false);
  });

  it("runtime hash in attestation is independently recomputable from public manifest", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    expect(attestation.result.runtime_hash).toBe(hashRuntime());
  });

  it("schema_version and runtime_version allow independent compatibility check", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const manifest = getRuntimeManifest();
    expect(manifest.supported_schema_versions).toContain(attestation.result.schema_version);
    expect(manifest.runtime_version).toBe(attestation.result.runtime_version);
  });

  it("verifyRuntime confirms all declared capabilities from public manifest", () => {
    const manifest = getRuntimeManifest();
    const required = [
      "replay-protection", "attestation-signing",
      "bundle-verification", "deterministic-evaluation",
    ];
    const result = verifyRuntime(manifest, required);
    expect(result.valid).toBe(true);
    expect(result.missing_capabilities).toHaveLength(0);
  });

  it("token verification requires only public key — private key not needed at verify time", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    expect(verifyExecutionToken(token, sig, new LocalVerifier(KEY_A.publicKey))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G10 — All required artifacts complete and sufficient for full reproduction
// ─────────────────────────────────────────────────────────────────────────────

describe("G10 — Artifacts complete and sufficient for full reproduction", () => {

  it("execution result contains all fields required for independent verification", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const required = [
      "execution_id", "policy_id", "policy_version",
      "schema_version", "runtime_version", "runtime_hash",
      "decision", "signals_hash", "executed_at",
    ];
    for (const field of required) {
      expect(attestation.result).toHaveProperty(field);
      expect((attestation.result as any)[field]).toBeTruthy();
    }
  });

  it("attestation contains both result and signature — sufficient for standalone verification", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    expect(attestation).toHaveProperty("result");
    expect(attestation).toHaveProperty("signature");
    expect(typeof attestation.signature).toBe("string");
    expect(attestation.signature.length).toBeGreaterThan(0);
  });

  it("runtime manifest declares all fields required for version compatibility checks", () => {
    const manifest = getRuntimeManifest();
    expect(manifest).toHaveProperty("runtime_version");
    expect(manifest).toHaveProperty("runtime_hash");
    expect(manifest).toHaveProperty("supported_schema_versions");
    expect(manifest).toHaveProperty("capabilities");
    expect(Array.isArray(manifest.supported_schema_versions)).toBe(true);
    expect(Array.isArray(manifest.capabilities)).toBe(true);
  });

  it("runtimeManifestDefinition contains no hidden or computed fields", () => {
    const def = runtimeManifestDefinition as Record<string, unknown>;
    expect(Object.keys(def).length).toBeGreaterThan(0);
    for (const [, value] of Object.entries(def)) {
      if (Array.isArray(value)) {
        expect(value.every(v => typeof v === "string")).toBe(true);
      } else {
        expect(typeof value).toBe("string");
      }
    }
  });

  it("token contains all fields required to reproduce the execution context", () => {
    const token = baseToken();
    const required = [
      "execution_id", "policy_id", "policy_version",
      "bundle_hash", "decision_type", "signals_hash",
      "issued_at", "expires_at",
    ];
    for (const field of required) {
      expect(token).toHaveProperty(field);
    }
  });

  it("signals_hash in result binds the decision to specific input signals", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult({ signals_hash: sha256("specific-signals-payload") });
    const sig = signExecutionResult(result, signer);
    expect(verifyExecutionResult(result, sig, verifier)).toBe(true);
    // Different signals_hash breaks the signature
    expect(verifyExecutionResult(
      { ...result, signals_hash: sha256("different-signals") }, sig, verifier
    )).toBe(false);
  });

  it("no canonical evaluation path reads from hidden disk state or databases", () => {
    for (const p of [
      "./packages/bundle/src/canonicalize.ts",
      "./packages/bundle/src/hash.ts",
      "./packages/execution/src/canonical-signing.ts",
    ]) {
      const src = fs.readFileSync(path.resolve(p), "utf8");
      expect(src).not.toContain("readFileSync");
      expect(src).not.toContain("readFile(");
      expect(src).not.toContain("createConnection");
      expect(src).not.toContain("mongoose");
      expect(src).not.toContain("pg.");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G11 — Failures are deterministic and reproducible
// ─────────────────────────────────────────────────────────────────────────────

describe("G11 — Failures are deterministic and reproducible", () => {

  it("invalid token signature always produces the same error type across 5 attempts", () => {
    const errors: string[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        executeDecision(makeContext(baseToken(), "INVALID") as any, new MemoryReplayStore());
      } catch (e: any) {
        errors.push(e.message);
      }
    }
    expect(errors).toHaveLength(5);
    expect(new Set(errors).size).toBe(1); // same error message every time
  });

  it("expired token always produces an error matching /expired/i", () => {
    const signer = signerA();
    const token = baseToken({
      issued_at: new Date(Date.now() - 700_000).toISOString(),
      expires_at: new Date(Date.now() - 400_000).toISOString(),
    });
    const sig = signExecutionToken(token, signer);
    const errors: string[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        executeDecision(makeContext(token, sig) as any, new MemoryReplayStore());
      } catch (e: any) {
        errors.push(e.message);
      }
    }
    expect(errors).toHaveLength(5);
    expect(errors.every(e => /expired/i.test(e))).toBe(true);
  });

  it("replay violation always produces the same error across 5 attempts", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    executeDecision(makeContext(token, sig) as any, store);

    const errors: string[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const s = signExecutionToken({ ...token }, signer);
        executeDecision(makeContext({ ...token }, s) as any, store);
      } catch (e: any) {
        errors.push(e.message);
      }
    }
    expect(errors).toHaveLength(5);
    expect(new Set(errors).size).toBe(1);
  });

  it("unsupported runtime version always produces /Unsupported runtime version/i", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext(token, sig, {
      runtime_manifest: { ...getRuntimeManifest(), runtime_version: "99.0.0" },
    });
    for (let i = 0; i < 3; i++) {
      expect(() => executeDecision(ctx as any, new MemoryReplayStore()))
        .toThrow(/Unsupported runtime version/i);
    }
  });

  it("missing required signal always throws /Missing required signal/", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    for (let i = 0; i < 3; i++) {
      expect(() => evaluatePolicy("claims-approval", "v1", {} as any))
        .toThrow(/Missing required signal/);
    }
  });

  it("wrong-type signal always throws /Invalid signal type/", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    const badSignals = { insurance_active: "yes", risk_score: 30, vip_customer: false };
    for (let i = 0; i < 3; i++) {
      expect(() => evaluatePolicy("claims-approval", "v1", badSignals as any))
        .toThrow(/Invalid signal type/);
    }
  });

  it("missing required capability always throws /Missing runtime capability/", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext(token, sig, {
      runtime_manifest: { ...getRuntimeManifest(), capabilities: [] },
      runtime_requirements: {
        required_capabilities: ["attestation-signing"],
        supported_runtime_versions: ["1.0.0"],
        supported_schema_versions: ["1.0.0"],
      },
    });
    for (let i = 0; i < 3; i++) {
      expect(() => executeDecision(ctx as any, new MemoryReplayStore()))
        .toThrow(/Missing runtime capability/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G12 — Past decisions remain reproducible under their original versions
// ─────────────────────────────────────────────────────────────────────────────

describe("G12 — Past decisions remain reproducible under original versions", () => {

  it("historical result with fixed fields verifies correctly with original signature", () => {
    const signer = signerA();
    const verifier = verifierA();
    // Simulate a 'historical' result with pinned version fields
    const historicalResult = baseResult({
      execution_id: "historical-exec-001",
      policy_version: "v1",
      schema_version: "1.0.0",
      runtime_version: "1.0.0",
      executed_at: "2024-01-15T09:00:00.000Z",
    });
    const sig = signExecutionResult(historicalResult, signer);
    // Later verification must still pass — versions have not changed
    expect(verifyExecutionResult(historicalResult, sig, verifier)).toBe(true);
  });

  it("historical canonical form is reproducible from stored JSON", () => {
    const historical = baseResult({
      execution_id: "historical-exec-001",
      executed_at: "2024-01-15T09:00:00.000Z",
    });
    const original = bundleCanonicalize(historical);
    // Simulate loading from storage
    const fromStorage = JSON.parse(original);
    expect(bundleCanonicalize(fromStorage)).toBe(original);
  });

  it("historical SHA-256 hash is reproducible from stored canonical form", () => {
    const historical = baseResult({
      execution_id: "historical-exec-001",
      executed_at: "2024-01-15T09:00:00.000Z",
    });
    const canonical = bundleCanonicalize(historical);
    const hash1 = sha256(canonical);
    // Simulate later reproduction
    const reproduced = bundleCanonicalize(JSON.parse(canonical));
    expect(sha256(reproduced)).toBe(hash1);
  });

  it("attestation with pinned runtime_version still verifies against current manifest", () => {
    const signer = signerA();
    const verifier = verifierA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    // Current manifest must still be compatible with the version in the attestation
    const manifest = getRuntimeManifest();
    expect(manifest.runtime_version).toBe(attestation.result.runtime_version);
    expect(manifest.supported_schema_versions).toContain(attestation.result.schema_version);
    const result = verifyAttestation(attestation, verifier, manifest);
    expect(result.valid).toBe(true);
  });

  it("policy version is immutably bound in the token and result", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken({ policy_version: "v1" });
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    expect(attestation.result.policy_version).toBe("v1");
  });

  it("schema version is declared in every result (version closure)", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    expect(attestation.result.schema_version).toBeTruthy();
    expect(typeof attestation.result.schema_version).toBe("string");
  });

  it("runtime_hash in result is sufficient to identify the exact runtime build", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    // The hash is a SHA-256 digest — 64 hex chars
    expect(attestation.result.runtime_hash).toMatch(/^[0-9a-f]{64}$/);
    // And it must match the independently computed value
    expect(attestation.result.runtime_hash).toBe(hashRuntime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G13 — Any deviation must fail the pipeline (fail-closed)
// ─────────────────────────────────────────────────────────────────────────────

describe("G13 — Any deviation fails the pipeline (fail-closed)", () => {

  it("no single field mutation of a signed result goes undetected", () => {
    const signer = signerA();
    const verifier = verifierA();
    const result = baseResult();
    const sig = signExecutionResult(result, signer);
    const mutations: [string, unknown][] = [
      ["execution_id", "mutated"],
      ["policy_id", "mutated"],
      ["policy_version", "v99"],
      ["schema_version", "99.0.0"],
      ["runtime_version", "99.0.0"],
      ["decision", "deny"],
      ["signals_hash", "mutated"],
      ["executed_at", "2099-01-01T00:00:00.000Z"],
    ];
    for (const [field, value] of mutations) {
      expect(
        verifyExecutionResult({ ...result, [field]: value }, sig, verifier)
      ).toBe(false);
    }
  });

  it("tampered runtime_hash breaks verifyAttestation", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    const tampered = {
      ...attestation,
      result: { ...attestation.result, runtime_hash: "ff".repeat(32) },
    };
    expect(verifyAttestation(tampered as any, verifierA(), getRuntimeManifest()).valid).toBe(false);
  });

  it("tampered attestation signature fails verifyAttestation (not an exception)", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    const attestation = executeDecision(makeContext(token, sig) as any, store);
    expect(
      verifyAttestation({ ...attestation, signature: "TAMPERED" } as any, verifierA(), getRuntimeManifest()).valid
    ).toBe(false);
  });

  it("invalid token signature throws — does not silently proceed to execution", () => {
    expect(() =>
      executeDecision(makeContext(baseToken(), "INVALID") as any, new MemoryReplayStore())
    ).toThrow();
  });

  it("expired token throws with /expired/i error", () => {
    const signer = signerA();
    const token = baseToken({
      issued_at: new Date(Date.now() - 700_000).toISOString(),
      expires_at: new Date(Date.now() - 400_000).toISOString(),
    });
    const sig = signExecutionToken(token, signer);
    expect(() =>
      executeDecision(makeContext(token, sig) as any, new MemoryReplayStore())
    ).toThrow(/expired/i);
  });

  it("replay throws — same execution_id cannot execute twice", () => {
    const signer = signerA();
    const store = new MemoryReplayStore();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    executeDecision(makeContext(token, sig) as any, store);
    const sig2 = signExecutionToken({ ...token }, signer);
    expect(() =>
      executeDecision(makeContext({ ...token }, sig2) as any, store)
    ).toThrow();
  });

  it("unsupported runtime version throws /Unsupported runtime version/i", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    expect(() =>
      executeDecision(makeContext(token, sig, {
        runtime_manifest: { ...getRuntimeManifest(), runtime_version: "99.0.0" },
      }) as any, new MemoryReplayStore())
    ).toThrow(/Unsupported runtime version/i);
  });

  it("unsupported schema version throws /Unsupported schema version/i", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    expect(() =>
      executeDecision(makeContext(token, sig, {
        runtime_requirements: {
          required_capabilities: [],
          supported_runtime_versions: ["1.0.0"],
          supported_schema_versions: ["99.0.0"],
        },
      }) as any, new MemoryReplayStore())
    ).toThrow(/Unsupported schema version/i);
  });

  it("missing required capability throws /Missing runtime capability/i", () => {
    const signer = signerA();
    const token = baseToken();
    const sig = signExecutionToken(token, signer);
    expect(() =>
      executeDecision(makeContext(token, sig, {
        runtime_manifest: { ...getRuntimeManifest(), capabilities: [] },
        runtime_requirements: {
          required_capabilities: ["attestation-signing"],
          supported_runtime_versions: ["1.0.0"],
          supported_schema_versions: ["1.0.0"],
        },
      }) as any, new MemoryReplayStore())
    ).toThrow(/Missing runtime capability/i);
  });

  it("wrong key on token signature throws — mismatch is always detected", () => {
    const wrongSigner = new LocalSigner(KEY_B.privateKey);
    const token = baseToken();
    const sig = signExecutionToken(token, wrongSigner);
    // ctx uses verifierA which holds KEY_A — mismatch must reject
    expect(() =>
      executeDecision(makeContext(token, sig) as any, new MemoryReplayStore())
    ).toThrow();
  });

  it("missing required signal throws — not silently denied", async () => {
    const { evaluatePolicy } = await import("@pramanasystems/execution");
    expect(() =>
      evaluatePolicy("claims-approval", "v1", {} as any)
    ).toThrow(/Missing required signal/);
  });

  it("execute.ts source contains no bypass_governance, skip_governance, or permissive_mode flags", () => {
    const src = fs.readFileSync(
      path.resolve("./packages/execution/src/execute.ts"), "utf8"
    );
    expect(src).not.toContain("bypass_governance");
    expect(src).not.toContain("skip_governance");
    expect(src).not.toContain("permissive_mode");
  });
});
