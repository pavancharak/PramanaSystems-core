/**
 * 05 — Verify Attestation
 *
 * Demonstrates verifyAttestation in detail: all three checks, tamper detection,
 * and a full runtime compatibility check against bundle requirements.
 *
 * Run from the repository root:
 *   npx tsx examples/05-verify-attestation/verify-attestation.ts
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
  verifyRuntimeCompatibility,
} from "@pramanasystems/verifier";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

// ── 1. Generate a key pair and execute a decision ─────────────────────────────
const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding:  { type: "spki",  format: "pem" },
});

const signer   = new LocalSigner(privateKey);
const verifier = new LocalVerifier(publicKey);

const signalsHash = crypto
  .createHash("sha256")
  .update(JSON.stringify({ patient_severity: 3, triage_complete: true }))
  .digest("hex");

const attestation = executeSimple(
  {
    policyId:      "claims-approval",
    policyVersion: "v1",
    decisionType:  "approve",
    signalsHash,
  },
  signer,
  verifier
);

console.log("=== ExecutionAttestation ===");
console.log("execution_id :", attestation.result.execution_id);
console.log("decision     :", attestation.result.decision);
console.log("executed_at  :", attestation.result.executed_at);

// ── 2. Verify the attestation — all three checks ─────────────────────────────
// verifyAttestation checks:
//   signature_verified — Ed25519 over canonical ExecutionResult
//   runtime_verified   — runtime_hash + runtime_version match the manifest
//   schema_compatible  — schema_version is in the manifest's supported list
const manifest = getRuntimeManifest();
const goodResult = verifyAttestation(attestation, verifier, manifest);

console.log("\n=== VerificationResult (valid attestation) ===");
console.log("valid              :", goodResult.valid);
console.log("signature_verified :", goodResult.checks.signature_verified);
console.log("runtime_verified   :", goodResult.checks.runtime_verified);
console.log("schema_compatible  :", goodResult.checks.schema_compatible);

// ── 3. Show tamper detection ──────────────────────────────────────────────────
// Mutating any field in ExecutionResult invalidates the signature.
const tampered = {
  result:    { ...attestation.result, decision: "deny" },
  signature: attestation.signature,
};
const tamperedResult = verifyAttestation(tampered, verifier, manifest);

console.log("\n=== VerificationResult (tampered decision) ===");
console.log("valid              :", tamperedResult.valid);
console.log("signature_verified :", tamperedResult.checks.signature_verified);

// ── 4. Show wrong-key detection ──────────────────────────────────────────────
const { publicKey: wrongPublicKey } = crypto.generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const wrongVerifier = new LocalVerifier(wrongPublicKey);
const wrongKeyResult = verifyAttestation(attestation, wrongVerifier, manifest);

console.log("\n=== VerificationResult (wrong public key) ===");
console.log("valid              :", wrongKeyResult.valid);
console.log("signature_verified :", wrongKeyResult.checks.signature_verified);

// ── 5. Runtime compatibility check ───────────────────────────────────────────
// verifyRuntimeCompatibility checks capabilities, runtime version, and schema
// version overlap against the bundle's declared requirements.
const requirements: RuntimeRequirements = {
  required_capabilities:      ["deterministic-evaluation", "attestation-signing", "replay-protection", "bundle-verification"],
  supported_runtime_versions: ["1.0.0"],
  supported_schema_versions:  ["1.0.0"],
};

const compat = verifyRuntimeCompatibility(manifest, requirements);

console.log("\n=== RuntimeCompatibilityResult ===");
console.log("valid                      :", compat.valid);
console.log("missing_capabilities       :", compat.missing_capabilities);
console.log("unsupported_runtime_version:", compat.unsupported_runtime_version);
console.log("unsupported_schema_version :", compat.unsupported_schema_version);

// ── 6. Show incompatible requirements ────────────────────────────────────────
const strictRequirements: RuntimeRequirements = {
  required_capabilities:      ["quantum-signing"],
  supported_runtime_versions: ["9.9.9"],
  supported_schema_versions:  ["99.0.0"],
};

const incompatResult = verifyRuntimeCompatibility(manifest, strictRequirements);

console.log("\n=== RuntimeCompatibilityResult (incompatible) ===");
console.log("valid                      :", incompatResult.valid);
console.log("missing_capabilities       :", incompatResult.missing_capabilities);
console.log("unsupported_runtime_version:", incompatResult.unsupported_runtime_version);
console.log("unsupported_schema_version :", incompatResult.unsupported_schema_version);
