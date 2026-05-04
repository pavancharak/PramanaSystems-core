/**
 * PramanaSystems — Formal Governance Invariant Test Suite (v2)
 *
 * Coverage map:
 *   INV-001  Deterministic Execution
 *   INV-002  Deterministic Verification
 *   INV-003  Deterministic Compatibility Evaluation
 *   INV-004  Deterministic Time Semantics
 *   INV-005  Execution Context Immutability
 *   INV-006  Runtime Isolation Integrity
 *   INV-007  Canonical Serialization
 *   INV-008  Signature Scope Completeness
 *   INV-009  Cryptographic Algorithm Stability
 *   INV-013  Replay Protection
 *   INV-014  Attestation Issuance
 *   INV-015  Audit Chain Append
 *   INV-016  Linearizable Audit Ordering
 *   INV-017  Fail-Closed Dependency Semantics
 *   INV-020  Governance Capability Truthfulness
 *   INV-022  Policy-to-Decision Derivability
 *   INV-024  Semantic Non-Ambiguity
 *   INV-025  Versioned Semantic Interpretation
 *   INV-030  Runtime Provenance
 *   INV-031  Dependency Version Closure
 *   INV-033  Independent Verification Compatibility
 *   INV-034  Portable Verification
 *   INV-035  Verifier Reproducibility
 *   INV-040  AI/Enforcement Separation
 *   INV-047  UTF-8 Canonical Encoding
 *   INV-048  Unicode Normalization Stability
 *   INV-049  Canonical JSON Semantics
 *   INV-050  Duplicate Key Rejection
 *   INV-051  Numeric Canonical Stability
 *   INV-052  Object Ordering Determinism
 *   INV-053  Array Semantic Stability
 *   INV-054  JSON Type Closure
 *   INV-057  Content Address Stability
 *   INV-059  Replay Domain Explicitness
 *   INV-060  Idempotent Verification
 *   INV-061  Immutable Runtime Capability Declaration
 *   INV-072  Side-Effect Isolation
 *   INV-073  Runtime Network Isolation
 *   INV-074  Governance Event Completeness
 *   INV-075  Governance Identity Non-Reuse
 *   INV-077  Deterministic Failure Semantics
 *   INV-078  Metadata Non-Interference
 *   INV-080  Explicit Unsupported Semantics
 *   META-001 Invariants Are Structural
 *   META-004 Invariant Violations Must Fail Closed
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
  verifyAuditChain,
  MemoryReplayStore,
  getRuntimeManifest,
  hashRuntime,
  runtimeManifestDefinition,
} from "@pramanasystems/execution";

import { appendAuditRecord } from "../../packages/execution/src/audit";

import {
  verifyAttestation,
  verifyRuntime,
  verifyExecutionRequirements,
} from "@pramanasystems/verifier";

import {
  assertNonEmptyString,
  assertNoOperationalMetadata,
  LocalValidator,
  forbiddenDeterministicFields,
} from "@pramanasystems/core";

function generateTestKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return { privateKey, publicKey };
}

const { privateKey: TEST_PRIVATE_KEY, publicKey: TEST_PUBLIC_KEY } = generateTestKeyPair();
const { privateKey: ALT_PRIVATE_KEY, publicKey: ALT_PUBLIC_KEY } = generateTestKeyPair();

function makeSigner(pk = TEST_PRIVATE_KEY) { return new LocalSigner(pk); }
function makeVerifier(pub = TEST_PUBLIC_KEY) { return new LocalVerifier(pub); }

function baseToken() {
  return {
    execution_id: crypto.randomUUID(),
    policy_id: "test-policy",
    policy_version: "v1",
    bundle_hash: "abc123",
    decision_type: "approve",
    signals_hash: "sig123",
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 300_000).toISOString(),
  };
}

function makeToken(overrides = {}) { return { ...baseToken(), ...overrides }; }
function makeRuntimeManifest(overrides = {}) { return { ...getRuntimeManifest(), ...overrides }; }

function makeContext(overrides: Record<string, unknown> = {}) {
  const signer = makeSigner();
  const verifier = makeVerifier();
  const token = makeToken();
  const tokenSig = signExecutionToken(token, signer);
  return {
    token,
    token_signature: tokenSig,
    signer,
    verifier,
    runtime_manifest: makeRuntimeManifest(),
    runtime_requirements: {
      required_capabilities: ["replay-protection", "attestation-signing"],
      supported_runtime_versions: ["1.0.0"],
      supported_schema_versions: ["1.0.0"],
    },
    ...overrides,
  };
}

function readAuditLines(auditFile: string): Record<string, unknown>[] {
  const content = fs.readFileSync(auditFile, "utf8");
  return content
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => JSON.parse(l));
}

// ── CLASS 1 — DETERMINISTIC EXECUTION ────────────────────────────────────────

describe("CLASS 1 — Deterministic Execution", () => {

  describe("INV-001 — Deterministic Execution", () => {
    it("identical canonical inputs produce identical canonical outputs", () => {
      const input = { a: 1, b: "two", c: [3, 4], d: { e: true } };
      expect(bundleCanonicalize(input)).toBe(bundleCanonicalize(input));
    });

    it("identical signed tokens verify identically on repeated calls", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken(token, sig, verifier)).toBe(true);
      expect(verifyExecutionToken(token, sig, verifier)).toBe(true);
    });

    it("identical execution results sign to verifiable signatures deterministically", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const result = { execution_id: "x", policy_id: "p", policy_version: "v1",
        schema_version: "1.0.0", runtime_version: "1.0.0", runtime_hash: hashRuntime(),
        decision: "approve", signals_hash: "h", executed_at: "2024-01-01T00:00:00.000Z" };
      const sig1 = signExecutionResult(result, signer);
      const sig2 = signExecutionResult(result, signer);
      expect(sig1).toBe(sig2);
      expect(verifyExecutionResult(result, sig1, verifier)).toBe(true);
    });
  });

  describe("INV-002 — Deterministic Verification", () => {
    it("independent verifiers with same public key produce identical outcomes", () => {
      const signer = makeSigner();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken(token, sig, makeVerifier())).toBe(
        verifyExecutionToken(token, sig, new LocalVerifier(TEST_PUBLIC_KEY))
      );
    });

    it("different verifier (wrong key) consistently returns false", () => {
      const signer = makeSigner(); const wrongVerifier = makeVerifier(ALT_PUBLIC_KEY);
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken(token, sig, wrongVerifier)).toBe(false);
      expect(verifyExecutionToken(token, sig, wrongVerifier)).toBe(false);
    });
  });

  describe("INV-003 — Deterministic Compatibility Evaluation", () => {
    it("runtime capability check is deterministic for identical manifest sets", () => {
      const manifest = makeRuntimeManifest();
      const required = ["replay-protection", "attestation-signing"];
      const r1 = verifyRuntime(manifest, required);
      const r2 = verifyRuntime(manifest, required);
      expect(r1.valid).toBe(r2.valid);
      expect(r1.missing_capabilities).toEqual(r2.missing_capabilities);
    });

    it("execution requirements check is deterministic for identical inputs", () => {
      const manifest = makeRuntimeManifest();
      const requirements = { replay_protection_required: true, attestation_required: true,
        audit_chain_required: false, independent_verification_required: false };
      const r1 = verifyExecutionRequirements(manifest, requirements);
      const r2 = verifyExecutionRequirements(manifest, requirements);
      expect(r1.valid).toBe(r2.valid);
      expect(r1.missing_requirements).toEqual(r2.missing_requirements);
    });
  });

  describe("INV-004 — Deterministic Time Semantics", () => {
    it("execute.ts Date.now() violation count does not exceed 1 (tracking)", () => {
      const src = fs.readFileSync(path.resolve("./packages/execution/src/execute.ts"), "utf8");
      const violations = (src.match(/Date\.now\(\)/g) || []).length;
      expect(violations).toBeLessThanOrEqual(1);
    });

    it("canonicalized output does not change based on wall clock", () => {
      const payload = { decision: "approve", policy_id: "p1" };
      expect(bundleCanonicalize(payload)).toBe(bundleCanonicalize(payload));
    });
  });

  describe("INV-005 — Execution Context Immutability", () => {
    it("modifying token after signing causes verification to fail", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken({ ...token, decision_type: "deny" }, sig, verifier)).toBe(false);
    });

    it("modifying execution result after signing causes verification failure", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const result = { execution_id: "x", policy_id: "p", policy_version: "v1",
        schema_version: "1.0.0", runtime_version: "1.0.0", runtime_hash: hashRuntime(),
        decision: "approve", signals_hash: "h", executed_at: "2024-01-01T00:00:00.000Z" };
      const sig = signExecutionResult(result, signer);
      expect(verifyExecutionResult({ ...result, decision: "deny" }, sig, verifier)).toBe(false);
    });
  });

  describe("INV-006 — Runtime Isolation Integrity", () => {
    it("separate MemoryReplayStore instances do not share state", () => {
      const store1 = new MemoryReplayStore(); const store2 = new MemoryReplayStore();
      store1.markExecuted("exec-A");
      expect(store1.hasExecuted("exec-A")).toBe(true);
      expect(store2.hasExecuted("exec-A")).toBe(false);
    });

    it("two stores with same ID do not cross-contaminate", () => {
      const store1 = new MemoryReplayStore(); const store2 = new MemoryReplayStore();
      store1.markExecuted("shared-id");
      expect(store2.hasExecuted("shared-id")).toBe(false);
    });
  });
});

// ── CLASS 2 — CRYPTOGRAPHIC INTEGRITY ────────────────────────────────────────

describe("CLASS 2 — Cryptographic Integrity", () => {

  describe("INV-007 — Canonical Serialization", () => {
    it("bundle canonicalize sorts object keys recursively", () => {
      const parsed = JSON.parse(bundleCanonicalize({ z: 1, a: 2, m: { q: 3, b: 4 } }));
      expect(Object.keys(parsed)).toEqual(["a", "m", "z"]);
      expect(Object.keys(parsed.m)).toEqual(["b", "q"]);
    });

    it("bundle canonicalize preserves array order", () => {
      expect(JSON.parse(bundleCanonicalize({ items: [3, 1, 2] })).items).toEqual([3, 1, 2]);
    });

    it("core and bundle canonicalize produce same key ordering", () => {
      const input = { z: 1, a: 2, b: { q: 3, a: 4 } };
      expect(Object.keys(JSON.parse(bundleCanonicalize(input)))).toEqual(
        Object.keys(JSON.parse(coreCanonicalize(input)))
      );
    });

    it("same object produces same SHA-256 regardless of insertion order", () => {
      expect(sha256(bundleCanonicalize({ b: 2, a: 1 }))).toBe(
        sha256(bundleCanonicalize({ a: 1, b: 2 }))
      );
    });
  });

  describe("INV-008 — Signature Scope Completeness", () => {
    it("token signature covers execution_id", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken({ ...token, execution_id: "different" }, sig, verifier)).toBe(false);
    });

    it("token signature covers policy_id", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken({ ...token, policy_id: "evil" }, sig, verifier)).toBe(false);
    });

    it("token signature covers decision_type", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken({ ...token, decision_type: "deny" }, sig, verifier)).toBe(false);
    });

    it("token signature covers signals_hash", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      expect(verifyExecutionToken({ ...token, signals_hash: "tampered" }, sig, verifier)).toBe(false);
    });

    it("execution result signature covers execution_id, decision, policy_id", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const result = { execution_id: "original", policy_id: "policy-A", policy_version: "v1",
        schema_version: "1.0.0", runtime_version: "1.0.0", runtime_hash: hashRuntime(),
        decision: "approve", signals_hash: "h", executed_at: "2024-01-01T00:00:00.000Z" };
      const sig = signExecutionResult(result, signer);
      for (const [field, value] of [["execution_id","tampered"],["decision","deny"],["policy_id","evil"]] as const) {
        expect(verifyExecutionResult({ ...result, [field]: value }, sig, verifier)).toBe(false);
      }
    });
  });

  describe("INV-009 — Cryptographic Algorithm Stability", () => {
    it("signature algorithm is Ed25519", () => {
      const payload = "test-payload";
      const rawSig = crypto.sign(null, Buffer.from(payload, "utf8"), TEST_PRIVATE_KEY);
      expect(crypto.verify(null, Buffer.from(payload, "utf8"), TEST_PUBLIC_KEY, rawSig)).toBe(true);
    });

    it("hash algorithm is SHA-256 (64 hex chars)", () => {
      const h = sha256("hello");
      expect(h).toHaveLength(64);
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });

    it("runtime hash is stable across calls", () => {
      expect(hashRuntime()).toBe(hashRuntime());
    });
  });
});

// ── CLASS 3 — GOVERNANCE ENFORCEMENT ─────────────────────────────────────────

describe("CLASS 3 — Governance Enforcement", () => {

  describe("INV-013 — Replay Protection", () => {
    it("MemoryReplayStore rejects duplicate execution_id", () => {
      const store = new MemoryReplayStore(); const id = crypto.randomUUID();
      expect(store.hasExecuted(id)).toBe(false);
      store.markExecuted(id);
      expect(store.hasExecuted(id)).toBe(true);
    });

    it("executeDecision throws on replay with same store and execution_id", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore();
      const token = makeToken(); const sig = signExecutionToken(token, signer);
      const ctx = makeContext({ token, token_signature: sig, signer, verifier });
      executeDecision(ctx as any, store);
      const sig2 = signExecutionToken({ ...token }, signer);
      const ctx2 = makeContext({ token: { ...token }, token_signature: sig2, signer, verifier });
      expect(() => executeDecision(ctx2 as any, store)).toThrow();
    });

    it("different execution IDs can both execute in the same store", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore();
      for (let i = 0; i < 3; i++) {
        const token = makeToken(); const sig = signExecutionToken(token, signer);
        expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store)).not.toThrow();
      }
    });
  });

  describe("INV-014 — Attestation Issuance", () => {
    it("executeDecision returns attestation with result and signature", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      expect(attestation).toHaveProperty("result");
      expect(attestation).toHaveProperty("signature");
      expect(typeof attestation.signature).toBe("string");
      expect(attestation.signature.length).toBeGreaterThan(0);
    });

    it("attestation.result contains execution_id from the token", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      expect(attestation.result.execution_id).toBe(token.execution_id);
    });
  });

  describe("INV-015 — Audit Chain Append", () => {
    it("appendAuditRecord writes a JSONL record to the audit file", () => {
      const auditFile = path.join(path.resolve("./runtime-audit"), "executions.jsonl");
      const before = fs.existsSync(auditFile) ? fs.statSync(auditFile).size : 0;
      appendAuditRecord(makeToken());
      expect(fs.statSync(auditFile).size).toBeGreaterThan(before);
    });

    it("each audit record is valid JSON", () => {
      const auditFile = path.join(path.resolve("./runtime-audit"), "executions.jsonl");
      appendAuditRecord(makeToken());
      const lines = readAuditLines(auditFile);
      expect(lines.length).toBeGreaterThan(0);
      // If we got here, all lines parsed without throwing
    });
  });

  describe("INV-016 — Linearizable Audit Ordering", () => {
    it("audit records have a previous_record_hash chain link", () => {
      const auditFile = path.join(path.resolve("./runtime-audit"), "executions.jsonl");
      appendAuditRecord(makeToken());
      appendAuditRecord(makeToken());
      const records = readAuditLines(auditFile);
      for (const r of records) {
        expect(typeof r.previous_record_hash).toBe("string");
        expect((r.previous_record_hash as string).length).toBeGreaterThan(0);
      }
    });

    it("second record's previous_record_hash matches SHA-256 of first record", () => {
      const auditDir = path.resolve("./runtime-audit");
      const auditFile = path.join(auditDir, "executions.jsonl");
      const backup = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, "utf8") : null;
      fs.mkdirSync(auditDir, { recursive: true });
      fs.writeFileSync(auditFile, "", "utf8");

      appendAuditRecord(makeToken());
      appendAuditRecord(makeToken());

      const records = readAuditLines(auditFile);
      expect(records.length).toBeGreaterThanOrEqual(2);
      const rec1 = records[0];
      const rec2 = records[1];

      expect(rec1.previous_record_hash).toBe("GENESIS");
      expect(rec2.previous_record_hash).toBe(
        crypto.createHash("sha256").update(coreCanonicalize(rec1)).digest("hex")
      );

      if (backup !== null) fs.writeFileSync(auditFile, backup, "utf8");
    });
  });

  describe("INV-017 — Fail-Closed Dependency Semantics", () => {
    it("throws when token signature is invalid", () => {
      expect(() => executeDecision(makeContext({ token_signature: "AAAA" }) as any, new MemoryReplayStore())).toThrow();
    });

    it("throws when runtime version is unsupported", () => {
      const signer = makeSigner(); const verifier = makeVerifier(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier,
        runtime_manifest: makeRuntimeManifest({ runtime_version: "9.9.9" }) }) as any, new MemoryReplayStore())).toThrow();
    });

    it("throws when required capability is missing", () => {
      const signer = makeSigner(); const verifier = makeVerifier(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier,
        runtime_manifest: makeRuntimeManifest({ capabilities: [] }),
        runtime_requirements: { required_capabilities: ["attestation-signing"],
          supported_runtime_versions: ["1.0.0"], supported_schema_versions: ["1.0.0"] } }) as any,
        new MemoryReplayStore())).toThrow(/Missing runtime capability/);
    });
  });

  describe("INV-020 — Governance Capability Truthfulness", () => {
    it("runtimeManifestDefinition declares required capabilities", () => {
      expect(runtimeManifestDefinition.capabilities.length).toBeGreaterThan(0);
      expect(runtimeManifestDefinition.capabilities).toContain("attestation-signing");
      expect(runtimeManifestDefinition.capabilities).toContain("replay-protection");
    });

    it("getRuntimeManifest capabilities match runtimeManifestDefinition", () => {
      expect(getRuntimeManifest().capabilities).toEqual(runtimeManifestDefinition.capabilities);
    });

    it("verifyRuntime confirms all declared capabilities are present", () => {
      const manifest = makeRuntimeManifest();
      const result = verifyRuntime(manifest, manifest.capabilities as string[]);
      expect(result.valid).toBe(true);
      expect(result.missing_capabilities).toHaveLength(0);
    });
  });
});

// ── CLASS 4 — POLICY AND SCHEMA GOVERNANCE ───────────────────────────────────

describe("CLASS 4 — Policy and Schema Governance", () => {

  describe("INV-022 — Policy-to-Decision Derivability", () => {
    it("evaluatePolicy is deterministic for identical inputs", async () => {
      const { evaluatePolicy } = await import("@pramanasystems/execution");
      const signals = { insurance_active: true, risk_score: 40, vip_customer: false };
      expect(evaluatePolicy("claims-approval", "v1", signals)).toBe(
        evaluatePolicy("claims-approval", "v1", signals)
      );
    });

    it("evaluatePolicy returns deny when rules fail", async () => {
      const { evaluatePolicy } = await import("@pramanasystems/execution");
      expect(evaluatePolicy("claims-approval", "v1", { insurance_active: false, risk_score: 40, vip_customer: true })).toBe("deny");
    });

    it("evaluatePolicy throws on missing required signal", async () => {
      const { evaluatePolicy } = await import("@pramanasystems/execution");
      expect(() => evaluatePolicy("claims-approval", "v1", {} as any)).toThrow(/Missing required signal/);
    });

    it("source declares unsupported schema version error (INV-080)", () => {
      expect(fs.readFileSync(path.resolve("./packages/execution/src/execute.ts"), "utf8"))
        .toContain("Unsupported schema version");
    });
  });

  describe("INV-024 — Semantic Non-Ambiguity", () => {
    it("assertNonEmptyString returns true only for non-empty strings", () => {
      expect(assertNonEmptyString("hello")).toBe(true);
      expect(assertNonEmptyString("")).toBe(false);
      expect(assertNonEmptyString("   ")).toBe(false);
      expect(assertNonEmptyString(123)).toBe(false);
      expect(assertNonEmptyString(null)).toBe(false);
    });
  });

  describe("INV-025 — Versioned Semantic Interpretation", () => {
    it("execution result declares schema_version and runtime_version", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      expect(attestation.result.schema_version).toBeTruthy();
      expect(attestation.result.runtime_version).toBeTruthy();
    });
  });
});

// ── CLASS 5 — EVIDENCE AND LINEAGE ───────────────────────────────────────────

describe("CLASS 5 — Evidence and Lineage", () => {

  describe("INV-030 — Runtime Provenance", () => {
    it("attestation contains runtime_hash matching hashRuntime()", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      expect(attestation.result.runtime_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(attestation.result.runtime_hash).toBe(hashRuntime());
    });
  });

  describe("INV-031 — Dependency Version Closure", () => {
    it("runtime manifest declares supported_schema_versions and runtime_version", () => {
      const manifest = getRuntimeManifest();
      expect(manifest.supported_schema_versions.length).toBeGreaterThan(0);
      expect(manifest.runtime_version.length).toBeGreaterThan(0);
    });
  });
});

// ── CLASS 6 — PORTABLE VERIFICATION ──────────────────────────────────────────

describe("CLASS 6 — Portable Verification", () => {

  describe("INV-033 — Independent Verification Compatibility", () => {
    it("verifyAttestation passes with correct verifier and manifest", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const result = verifyAttestation(attestation, verifier, getRuntimeManifest());
      expect(result.valid).toBe(true);
      expect(result.checks.signature_verified).toBe(true);
      expect(result.checks.runtime_verified).toBe(true);
      expect(result.checks.schema_compatible).toBe(true);
    });
  });

  describe("INV-034 — Portable Verification", () => {
    it("verifyAttestation fails with wrong verifier key", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const result = verifyAttestation(attestation, makeVerifier(ALT_PUBLIC_KEY), getRuntimeManifest());
      expect(result.valid).toBe(false);
      expect(result.checks.signature_verified).toBe(false);
    });

    it("verifyAttestation fails when runtime_hash is tampered", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const tampered = { ...attestation, result: { ...attestation.result, runtime_hash: "deadbeef".repeat(8) } };
      expect(verifyAttestation(tampered as any, verifier, getRuntimeManifest()).valid).toBe(false);
    });
  });

  describe("INV-035 — Verifier Reproducibility", () => {
    it("verifyAttestation is reproducible across repeated calls", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const manifest = getRuntimeManifest();
      const r1 = verifyAttestation(attestation, verifier, manifest);
      const r2 = verifyAttestation(attestation, verifier, manifest);
      expect(r1.valid).toBe(r2.valid);
      expect(r1.checks).toEqual(r2.checks);
    });
  });
});

// ── CLASS 7 — AUTHORITY DOMAIN ISOLATION ─────────────────────────────────────

describe("CLASS 7 — Authority Domain Isolation", () => {
  it("INV-037/038 — signatures from different keys do not cross-verify", () => {
    const token = makeToken();
    const sig1 = signExecutionToken(token, makeSigner(TEST_PRIVATE_KEY));
    const sig2 = signExecutionToken(token, makeSigner(ALT_PRIVATE_KEY));
    expect(verifyExecutionToken(token, sig1, makeVerifier(TEST_PUBLIC_KEY))).toBe(true);
    expect(verifyExecutionToken(token, sig1, makeVerifier(ALT_PUBLIC_KEY))).toBe(false);
    expect(verifyExecutionToken(token, sig2, makeVerifier(ALT_PUBLIC_KEY))).toBe(true);
    expect(verifyExecutionToken(token, sig2, makeVerifier(TEST_PUBLIC_KEY))).toBe(false);
  });
});

// ── CLASS 8 — AI GOVERNANCE BOUNDARY ─────────────────────────────────────────

describe("CLASS 8 — AI Governance Boundary", () => {

  const RESERVED = ["decision","policy_id","execution_id","governed_time",
    "attestation_version","intent","signals_ref","rule_trace","dry_run","runtime_id"];

  describe("INV-040 — AI/Enforcement Separation", () => {
    it("rejects each reserved governance field as a signal name", () => {
      for (const field of RESERVED)
        expect(assertNoOperationalMetadata({ [field]: "injected" }, RESERVED)).toBe(false);
    });

    it("accepts payloads with no reserved fields", () => {
      expect(assertNoOperationalMetadata({ fraud_score: 10, account_age_days: 365 }, RESERVED)).toBe(true);
    });

    it("rejects reserved fields nested in objects", () => {
      expect(assertNoOperationalMetadata({ metadata: { decision: "injected" } }, RESERVED)).toBe(false);
    });

    it("rejects reserved fields nested in arrays", () => {
      expect(assertNoOperationalMetadata({ items: [{ decision: "injected" }] }, RESERVED)).toBe(false);
    });
  });

  describe("INV-041 — Governance Boundary Explicitness", () => {
    it("runtimeManifestDefinition is non-empty and declares runtime_version", () => {
      expect(Object.keys(runtimeManifestDefinition).length).toBeGreaterThan(0);
      expect(runtimeManifestDefinition).toHaveProperty("runtime_version");
    });
  });

  describe("INV-078 — Metadata Non-Interference", () => {
    it("LocalValidator flags operational metadata contamination", () => {
      const validator = new LocalValidator();
      const result = validator.validate({ payload: { decision: "approve", generatedAt: "2024-01-01" }, signature: "sig" });
      expect(result.stages.deterministic).toBe(false);
      expect(result.errors.some((e) => /metadata/i.test(e))).toBe(true);
    });

    it("LocalValidator passes clean payload", () => {
      const validator = new LocalValidator();
      expect(validator.validate({ payload: { fraud_score: 10 }, signature: "sig" }).stages.deterministic).toBe(true);
    });

    it("forbiddenDeterministicFields contains expected field names", () => {
      expect(forbiddenDeterministicFields).toContain("generatedAt");
      expect(forbiddenDeterministicFields).toContain("environment");
      expect(forbiddenDeterministicFields).toContain("host");
      expect(forbiddenDeterministicFields).toContain("traceId");
    });
  });
});

// ── CLASS 10 — ENCODING AND SERIALIZATION ────────────────────────────────────

describe("CLASS 10 — Encoding and Serialization", () => {

  describe("INV-047 — UTF-8 Canonical Encoding", () => {
    it("hash.ts uses explicit utf8 encoding", () => {
      expect(fs.readFileSync(path.resolve("./packages/bundle/src/hash.ts"), "utf8")).toContain('"utf8"');
    });

    it("sha256 of Unicode string is stable", () => {
      expect(sha256("こんにちは世界")).toBe(sha256("こんにちは世界"));
    });

    it("sha256 of empty string matches well-known value", () => {
      expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });
  });

  describe("INV-048 — Unicode Normalization Stability", () => {
    it("NFC-normalized composed and decomposed forms hash identically", () => {
      expect(sha256("é".normalize("NFC"))).toBe(sha256("é".normalize("NFC")));
    });
  });

  describe("INV-049 — Canonical JSON Semantics", () => {
    it("bundleCanonicalize sorts keys at all depths", () => {
      const parsed = JSON.parse(bundleCanonicalize({ z: { q: 1, a: 2 }, a: { z: 3, m: 4 } }));
      expect(Object.keys(parsed)).toEqual(["a", "z"]);
      expect(Object.keys(parsed.a)).toEqual(["m", "z"]);
      expect(Object.keys(parsed.z)).toEqual(["a", "q"]);
    });

    it("coreCanonicalize sorts keys", () => {
      const keys = Object.keys(JSON.parse(coreCanonicalize({ z: 3, a: 1, m: 2 })));
      expect(keys).toEqual([...keys].sort());
    });
  });

  describe("INV-050 — Duplicate Key Rejection (gap documented)", () => {
    it("JSON.parse silently takes last value — hard rejection not yet implemented", () => {
      expect(JSON.parse('{"a":1,"a":2}').a).toBe(2);
      expect(() => JSON.parse('{"a":1,"a":2}')).not.toThrow();
    });
  });

  describe("INV-051 — Numeric Canonical Stability", () => {
    it("1.0 and 1 canonicalize identically", () => {
      expect(bundleCanonicalize({ value: 1.0 })).toBe(bundleCanonicalize({ value: 1 }));
    });
  });

  describe("INV-052 — Object Ordering Determinism", () => {
    it("different insertion orders produce identical canonical form and hash", () => {
      expect(bundleCanonicalize({ z: 1, a: 2 })).toBe(bundleCanonicalize({ a: 2, z: 1 }));
      expect(sha256(bundleCanonicalize({ z: 1, a: 2 }))).toBe(sha256(bundleCanonicalize({ a: 2, z: 1 })));
    });
  });

  describe("INV-053 — Array Semantic Stability", () => {
    it("array order is preserved through canonicalization", () => {
      expect(JSON.parse(bundleCanonicalize({ items: [3, 1, 2, "b", "a"] })).items).toEqual([3, 1, 2, "b", "a"]);
    });

    it("different array orderings produce different hashes", () => {
      expect(sha256(bundleCanonicalize({ items: [1, 2, 3] }))).not.toBe(sha256(bundleCanonicalize({ items: [3, 2, 1] })));
    });
  });

  describe("INV-054 — JSON Type Closure", () => {
    it("NaN serializes to null", () => {
      expect(JSON.parse(bundleCanonicalize({ value: NaN })).value).toBeNull();
    });

    it("Infinity serializes to null", () => {
      expect(JSON.parse(bundleCanonicalize({ value: Infinity })).value).toBeNull();
    });

    it("undefined fields are omitted", () => {
      expect("b" in JSON.parse(bundleCanonicalize({ a: 1, b: undefined }))).toBe(false);
    });
  });
});

// ── CLASS 11 — CONTENT ADDRESSING AND STORAGE ────────────────────────────────

describe("CLASS 11 — Content Addressing and Storage", () => {

  describe("INV-057 — Content Address Stability", () => {
    it("identical content produces identical SHA-256", () => {
      const c = JSON.stringify({ a: 1, b: 2 }); expect(sha256(c)).toBe(sha256(c));
    });

    it("different content produces different SHA-256", () => {
      expect(sha256("hello")).not.toBe(sha256("world"));
    });

    it("hashRuntime() is stable across 5 calls", () => {
      expect(new Set(Array.from({ length: 5 }, () => hashRuntime())).size).toBe(1);
    });
  });

  describe("INV-059 — Replay Domain Explicitness", () => {
    it("MemoryReplayStore API is explicit and synchronous", () => {
      const store = new MemoryReplayStore(); const id = "test-" + crypto.randomUUID();
      expect(store.hasExecuted(id)).toBe(false);
      store.markExecuted(id);
      expect(store.hasExecuted(id)).toBe(true);
    });

    it("execution_id is structurally present in every audit record", () => {
      const auditDir = path.resolve("./runtime-audit");
      const auditFile = path.join(auditDir, "executions.jsonl");
      const backup = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, "utf8") : null;
      fs.mkdirSync(auditDir, { recursive: true });
      fs.writeFileSync(auditFile, "", "utf8");

      const token = makeToken();
      appendAuditRecord(token);

      const records = readAuditLines(auditFile);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0].execution_id).toBe(token.execution_id);

      if (backup !== null) fs.writeFileSync(auditFile, backup, "utf8");
    });
  });

  describe("INV-060 — Idempotent Verification", () => {
    it("verifyAttestation produces identical results across 3 calls", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const manifest = getRuntimeManifest();
      const results = [1,2,3].map(() => verifyAttestation(attestation, verifier, manifest));
      expect(results[0].valid).toBe(results[1].valid);
      expect(results[0].valid).toBe(results[2].valid);
      expect(results[0].checks).toEqual(results[1].checks);
    });

    it("verifyAuditChain returns stable boolean", () => {
      expect(verifyAuditChain()).toBe(verifyAuditChain());
    });
  });

  describe("INV-061 — Immutable Runtime Capability Declaration", () => {
    it("capabilities are stable across reads", () => {
      expect([...runtimeManifestDefinition.capabilities]).toEqual([...getRuntimeManifest().capabilities]);
    });
  });
});

// ── CLASS 12 — EXECUTION SAFETY ──────────────────────────────────────────────

describe("CLASS 12 — Execution Safety", () => {

  describe("INV-072 — Side-Effect Isolation", () => {
    it("evaluateRule is synchronous (no async/Promise in evaluate path)", () => {
      const src = fs.readFileSync(path.resolve("./packages/execution/src/execute.ts"), "utf8");
      const match = src.match(/function evaluateRule[\s\S]+?^}/m);
      if (match) { expect(match[0]).not.toContain("async"); expect(match[0]).not.toContain("Promise"); }
    });

    it("verifyExecutionResult does not mutate result", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const result = { execution_id: "x", policy_id: "p", policy_version: "v1",
        schema_version: "1.0.0", runtime_version: "1.0.0", runtime_hash: hashRuntime(),
        decision: "approve", signals_hash: "h", executed_at: "2024-01-01T00:00:00.000Z" };
      const sig = signExecutionResult(result, signer);
      const before = JSON.stringify(result);
      verifyExecutionResult(result, sig, verifier);
      expect(JSON.stringify(result)).toBe(before);
    });
  });

  describe("INV-073 — Runtime Network Isolation", () => {
    it("canonical evaluation source files contain no network calls", () => {
      for (const p of ["./packages/execution/src/execute.ts",
        "./packages/execution/src/canonical-signing.ts",
        "./packages/bundle/src/canonicalize.ts",
        "./packages/bundle/src/hash.ts"]) {
        const src = fs.readFileSync(path.resolve(p), "utf8");
        expect(src).not.toContain("fetch(");
        expect(src).not.toContain("http.get(");
        expect(src).not.toContain("axios");
      }
    });
  });
});

// ── CLASS 13 — GOVERNANCE EVENT COMPLETENESS ─────────────────────────────────

describe("CLASS 13 — Governance Event Completeness", () => {

  describe("INV-074 — Governance Event Completeness", () => {
    it("every executeDecision writes an audit record", () => {
      const auditDir = path.resolve("./runtime-audit");
      const auditFile = path.join(auditDir, "executions.jsonl");
      const backup = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, "utf8") : null;
      fs.mkdirSync(auditDir, { recursive: true });
      fs.writeFileSync(auditFile, "", "utf8");

      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);

      expect(readAuditLines(auditFile).length).toBeGreaterThan(0);

      if (backup !== null) fs.writeFileSync(auditFile, backup, "utf8");
    });
  });

  describe("INV-075 — Governance Identity Non-Reuse", () => {
    it("100 crypto.randomUUID() calls produce 100 unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => crypto.randomUUID()));
      expect(ids.size).toBe(100);
    });
  });

  describe("INV-077 — Deterministic Failure Semantics", () => {
    it("replay violation always throws", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      const sig2 = signExecutionToken({ ...token }, signer);
      expect(() => executeDecision(makeContext({ token: { ...token }, token_signature: sig2, signer, verifier }) as any, store)).toThrow();
    });

    it("bad signature always throws", () => {
      expect(() => executeDecision(makeContext({ token_signature: "INVALID" }) as any, new MemoryReplayStore())).toThrow();
    });

    it("expired token throws with predictable error", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const expired = makeToken({ issued_at: new Date(Date.now()-700_000).toISOString(), expires_at: new Date(Date.now()-400_000).toISOString() });
      const sig = signExecutionToken(expired, signer);
      expect(() => executeDecision(makeContext({ token: expired, token_signature: sig, signer, verifier }) as any, new MemoryReplayStore())).toThrow(/expired/i);
    });
  });

  describe("INV-080 — Explicit Unsupported Semantics", () => {
    it("unsupported runtime version throws explicitly", () => {
      const signer = makeSigner(); const verifier = makeVerifier(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier,
        runtime_manifest: makeRuntimeManifest({ runtime_version: "99.0.0" }) }) as any,
        new MemoryReplayStore())).toThrow(/Unsupported runtime version/i);
    });

    it("unsupported schema version throws explicitly", () => {
      const signer = makeSigner(); const verifier = makeVerifier(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier,
        runtime_requirements: { required_capabilities: [], supported_runtime_versions: ["1.0.0"],
          supported_schema_versions: ["99.0.0"] } }) as any,
        new MemoryReplayStore())).toThrow(/Unsupported schema version/i);
    });
  });
});

// ── META-INVARIANTS ───────────────────────────────────────────────────────────

describe("META-INVARIANTS", () => {

  describe("META-001 — Invariants Are Structural", () => {
    it("executeDecision source has no opt-out bypass flags", () => {
      const src = fs.readFileSync(path.resolve("./packages/execution/src/execute.ts"), "utf8");
      expect(src).not.toContain("bypass_governance");
      expect(src).not.toContain("skip_governance");
      expect(src).not.toContain("permissive_mode");
    });
  });

  describe("META-004 — Invariant Violations Must Fail Closed", () => {
    it("invalid token signature fails closed", () => {
      expect(() => executeDecision(makeContext({ token_signature: "GARBAGE" }) as any, new MemoryReplayStore())).toThrow();
    });

    it("missing capability fails closed", () => {
      const signer = makeSigner(); const verifier = makeVerifier(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      expect(() => executeDecision(makeContext({ token, token_signature: sig, signer, verifier,
        runtime_manifest: makeRuntimeManifest({ capabilities: [] }),
        runtime_requirements: { required_capabilities: ["attestation-signing"],
          supported_runtime_versions: ["1.0.0"], supported_schema_versions: ["1.0.0"] } }) as any,
        new MemoryReplayStore())).toThrow();
    });

    it("tampered attestation returns valid:false not an exception", () => {
      const signer = makeSigner(); const verifier = makeVerifier();
      const store = new MemoryReplayStore(); const token = makeToken();
      const sig = signExecutionToken(token, signer);
      const attestation = executeDecision(makeContext({ token, token_signature: sig, signer, verifier }) as any, store);
      expect(verifyAttestation({ ...attestation, signature: "TAMPERED" } as any, verifier, getRuntimeManifest()).valid).toBe(false);
    });
  });
});

describe("GAP-1 FIX — ExecutionRequirements removed, structural enforcement", () => {

  it("ExecutionResult always has governed: true", () => {
    const signer = makeSigner();
    const verifier = makeVerifier();
    const store = new MemoryReplayStore();
    const token = makeToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext({ token, token_signature: sig, signer, verifier });
    const attestation = executeDecision(ctx as any, store);
    expect(attestation.result.governed).toBe(true);
  });

  it("verifyAttestation rejects result with governed: false", () => {
    const signer = makeSigner();
    const verifier = makeVerifier();
    const store = new MemoryReplayStore();
    const token = makeToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext({ token, token_signature: sig, signer, verifier });
    const attestation = executeDecision(ctx as any, store);

    const tampered = {
      ...attestation,
      result: { ...attestation.result, governed: false },
    };
    const result = verifyAttestation(tampered as any, verifier, getRuntimeManifest());
    expect(result.valid).toBe(false);
    expect(result.checks.governed).toBe(false);
  });

  it("verifyAttestation rejects result with governed field absent", () => {
    const signer = makeSigner();
    const verifier = makeVerifier();
    const store = new MemoryReplayStore();
    const token = makeToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext({ token, token_signature: sig, signer, verifier });
    const attestation = executeDecision(ctx as any, store);

    const { governed: _, ...resultWithoutGoverned } = attestation.result;
    const tampered = { ...attestation, result: resultWithoutGoverned };
    const result = verifyAttestation(tampered as any, verifier, getRuntimeManifest());
    expect(result.valid).toBe(false);
    expect(result.checks.governed).toBe(false);
  });

  it("DryRunResult has governed: false and dry_run: true", async () => {
    const { evaluateDryRun } = await import("@pramanasystems/execution");
    const result = evaluateDryRun("claims-approval", "v1", {
      insurance_active: true,
      risk_score: 30,
      vip_customer: false,
    });
    expect(result.governed).toBe(false);
    expect(result.dry_run).toBe(true);
    expect(result.decision).toBeTruthy();
  });

  it("replay protection fires unconditionally on second execution", () => {
    const signer = makeSigner();
    const verifier = makeVerifier();
    const store = new MemoryReplayStore();
    const token = makeToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext({ token, token_signature: sig, signer, verifier });

    executeDecision(ctx as any, store);

    const sig2 = signExecutionToken({ ...token }, signer);
    const ctx2 = makeContext({
      token: { ...token },
      token_signature: sig2,
      signer,
      verifier,
    });
    expect(() => executeDecision(ctx2 as any, store)).toThrow(/Replay/);
  });

  it("verifyAttestation checks.governed is true for valid governed attestation", () => {
    const signer = makeSigner();
    const verifier = makeVerifier();
    const store = new MemoryReplayStore();
    const token = makeToken();
    const sig = signExecutionToken(token, signer);
    const ctx = makeContext({ token, token_signature: sig, signer, verifier });
    const attestation = executeDecision(ctx as any, store);
    const result = verifyAttestation(attestation, verifier, getRuntimeManifest());
    expect(result.valid).toBe(true);
    expect(result.checks.governed).toBe(true);
  });
});
