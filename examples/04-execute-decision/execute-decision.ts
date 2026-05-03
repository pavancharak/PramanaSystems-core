/**
 * 04 — Execute Decision
 *
 * Full executeDecision pipeline: issue a time-limited execution token, sign it,
 * construct a strict ExecutionContext, run the governance pipeline, and verify
 * the returned ExecutionAttestation.  Also demonstrates replay protection.
 *
 * Run from the repository root:
 *   npx tsx examples/04-execute-decision/execute-decision.ts
 */

import crypto from "crypto";

import {
  issueExecutionToken,
  signExecutionToken,
  executeDecision,
  MemoryReplayStore,
  LocalSigner,
  LocalVerifier,
  getRuntimeManifest,
} from "@pramanasystems/execution";

import type {
  ExecutionContext,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
  ExecutionRequirements,
} from "@pramanasystems/governance";

import {
  verifyAttestation,
} from "@pramanasystems/verifier";

// ── 1. Generate an Ed25519 key pair ───────────────────────────────────────────
const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding:  { type: "spki",  format: "pem" },
});

const signer   = new LocalSigner(privateKey);
const verifier = new LocalVerifier(publicKey);

// ── 2. Hash the input signals ─────────────────────────────────────────────────
const signals = { insurance_active: true, risk_score: 12, claim_amount: 4500 };
const signalsHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(signals))
  .digest("hex");

// ── 3. Issue an execution token ───────────────────────────────────────────────
// issueExecutionToken reads the bundle hash from ./policies/<id>/<version>/
// bundle.manifest.json and calls validatePolicy to confirm the policy exists.
const token = issueExecutionToken(
  "claims-approval",
  "v1",
  "approve",
  signalsHash
);

console.log("=== ExecutionToken ===");
console.log("execution_id  :", token.execution_id);
console.log("policy_id     :", token.policy_id);
console.log("policy_version:", token.policy_version);
console.log("bundle_hash   :", token.bundle_hash.slice(0, 16) + "…");
console.log("issued_at     :", token.issued_at);
console.log("expires_at    :", token.expires_at);

// ── 4. Sign the token ─────────────────────────────────────────────────────────
const tokenSignature = signExecutionToken(token, signer);
console.log("\ntokenSignature :", tokenSignature.slice(0, 32) + "…");

// ── 5. Construct the ExecutionContext ─────────────────────────────────────────
// RuntimeRequirements declares which runtime versions and capabilities are
// acceptable.  ExecutionRequirements enables the security flags.
const runtimeRequirements: RuntimeRequirements = {
  required_capabilities:       ["deterministic-evaluation", "attestation-signing", "replay-protection"],
  supported_runtime_versions:  ["1.0.0"],
  supported_schema_versions:   ["1.0.0"],
};

const executionRequirements: ExecutionRequirements = {
  replay_protection_required:          true,
  attestation_required:                true,
  audit_chain_required:                false,
  independent_verification_required:   true,
};

const context: ExecutionContext = {
  token,
  token_signature:     tokenSignature,
  signer,
  verifier,
  runtime_manifest:    getRuntimeManifest(),
  runtime_requirements: runtimeRequirements,
  execution_requirements: executionRequirements,
};

// ── 6. Execute the governance decision ───────────────────────────────────────
const replayStore   = new MemoryReplayStore();
const attestation   = executeDecision(context, replayStore);

console.log("\n=== ExecutionAttestation ===");
console.log("execution_id  :", attestation.result.execution_id);
console.log("policy_id     :", attestation.result.policy_id);
console.log("decision      :", attestation.result.decision);
console.log("runtime_hash  :", attestation.result.runtime_hash.slice(0, 16) + "…");
console.log("signature     :", attestation.signature.slice(0, 32) + "…");

// ── 7. Independently verify the attestation ───────────────────────────────────
const manifest   = getRuntimeManifest();
const result     = verifyAttestation(attestation, verifier, manifest);

console.log("\n=== VerificationResult ===");
console.log("valid              :", result.valid);
console.log("signature_verified :", result.checks.signature_verified);
console.log("runtime_verified   :", result.checks.runtime_verified);
console.log("schema_compatible  :", result.checks.schema_compatible);

// ── 8. Demonstrate replay protection ─────────────────────────────────────────
// Submitting the same execution_id a second time is rejected.
console.log("\n=== Replay protection ===");
try {
  executeDecision(context, replayStore);
  console.log("ERROR: second execution should have been rejected");
} catch (err) {
  console.log("second execution rejected:", (err as Error).message);
}
