/**
 * 01 — Quickstart
 *
 * Minimal end-to-end example: generate an ephemeral Ed25519 key pair, execute
 * a governance decision using executeSimple, then independently verify the
 * returned ExecutionAttestation.
 *
 * Run from the repository root:
 *   npx tsx examples/01-quickstart/quickstart.ts
 */

import crypto from "crypto";

import {
  executeSimple,
  LocalSigner,
  LocalVerifier,
  getRuntimeManifest,
} from "@pramanasystems/execution";

import {
  verifyAttestation,
} from "@pramanasystems/verifier";

// ── 1. Generate an ephemeral Ed25519 key pair ─────────────────────────────
// In production, load stable keys from environment variables or a KMS.
const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const signer = new LocalSigner(privateKey);
const verifier = new LocalVerifier(publicKey);

// ── 2. Hash the signals payload ───────────────────────────────────────────
// Signals are always passed as a SHA-256 hex digest, not inline.
// Use canonicalize() from @pramanasystems/bundle for deterministic hashing
// of structured payloads.
const signals = { insurance_active: true, risk_score: 42, vip_customer: false };
const signalsHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(signals))
  .digest("hex");

// ── 3. Execute the governance decision ───────────────────────────────────
// executeSimple handles token issuance, signing, replay store, and attestation
// in a single call. The policy must exist at ./policies/claims-approval/v1/.
const attestation = executeSimple(
  {
    policyId:     "claims-approval",
    policyVersion: "v1",
    decisionType: "approve",
    signalsHash,
  },
  signer,
  verifier,
);

console.log("=== ExecutionAttestation ===");
console.log("execution_id  :", attestation.result.execution_id);
console.log("policy_id     :", attestation.result.policy_id);
console.log("policy_version:", attestation.result.policy_version);
console.log("decision      :", attestation.result.decision);
console.log("signals_hash  :", attestation.result.signals_hash);
console.log("executed_at   :", attestation.result.executed_at);
console.log("runtime_hash  :", attestation.result.runtime_hash);
console.log("signature     :", attestation.signature.slice(0, 32) + "…");

// ── 4. Independently verify the attestation ───────────────────────────────
// verifyAttestation performs three checks:
//   signature_verified — Ed25519 signature over the canonical ExecutionResult
//   runtime_verified   — runtime_hash + runtime_version match the trusted manifest
//   schema_compatible  — schema_version is in the runtime's supported list
const manifest = getRuntimeManifest();
const result = verifyAttestation(attestation, verifier, manifest);

console.log("\n=== VerificationResult ===");
console.log("valid              :", result.valid);
console.log("signature_verified :", result.checks.signature_verified);
console.log("runtime_verified   :", result.checks.runtime_verified);
console.log("schema_compatible  :", result.checks.schema_compatible);
