/**
 * 08 — Bundle Verification
 *
 * Verifies the on-disk integrity of a policy bundle and checks runtime
 * compatibility against the bundle's declared requirements.
 *
 * Run from the repository root:
 *   npx tsx examples/08-bundle-verification/bundle-verification.ts
 */

import {
  verifyBundle,
  verifyRuntimeCompatibility,
} from "@pramanasystems/verifier";

import {
  getRuntimeManifest,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

const POLICY_DIR     = "./policies/claims-approval/v1";
const MANIFEST_PATH  = `${POLICY_DIR}/bundle.manifest.json`;
const SIGNATURE_PATH = `${POLICY_DIR}/bundle.sig`;

// ── 1. Verify the bundle ──────────────────────────────────────────────────────
// verifyBundle performs two independent checks:
//   bundle_verified    — re-hashes every artifact and compares against manifest
//   signature_verified — verifies the Ed25519 manifest signature in bundle.sig
console.log("=== verifyBundle ===");
console.log("manifest  :", MANIFEST_PATH);
console.log("signature :", SIGNATURE_PATH);

const bundleResult = verifyBundle(MANIFEST_PATH, SIGNATURE_PATH);

console.log("\nvalid              :", bundleResult.valid);
console.log("manifest_verified  :", bundleResult.manifest_verified);
console.log("signature_verified :", bundleResult.signature_verified);
console.log("bundle_verified    :", bundleResult.bundle_verified);

// ── 2. Check runtime compatibility ────────────────────────────────────────────
// verifyRuntimeCompatibility confirms the active runtime satisfies the
// capability, runtime-version, and schema-version requirements declared by
// the bundle.  These requirements would normally come from bundle.manifest.json
// via readManifest(), reproduced here as a constant for clarity.
const requirements: RuntimeRequirements = {
  required_capabilities:      [
    "deterministic-evaluation",
    "attestation-signing",
    "replay-protection",
    "bundle-verification",
  ],
  supported_runtime_versions: ["1.0.0"],
  supported_schema_versions:  ["1.0.0"],
};

const manifest = getRuntimeManifest();

console.log("\n=== Runtime manifest ===");
console.log("runtime_version          :", manifest.runtime_version);
console.log("runtime_hash             :", manifest.runtime_hash.slice(0, 16) + "…");
console.log("supported_schema_versions:", [...manifest.supported_schema_versions]);
console.log("capabilities             :", [...manifest.capabilities]);

const compat = verifyRuntimeCompatibility(manifest, requirements);

console.log("\n=== verifyRuntimeCompatibility ===");
console.log("valid                      :", compat.valid);
console.log("missing_capabilities       :", compat.missing_capabilities);
console.log("unsupported_runtime_version:", compat.unsupported_runtime_version);
console.log("unsupported_schema_version :", compat.unsupported_schema_version);

// ── 3. Simulate a bundle from an incompatible future runtime ──────────────────
// Demonstrates what happens when the runtime does not satisfy the requirements.
const futureRequirements: RuntimeRequirements = {
  required_capabilities:      ["deterministic-evaluation", "zk-proof-generation"],
  supported_runtime_versions: ["2.0.0"],
  supported_schema_versions:  ["2.0.0"],
};

const futureCompat = verifyRuntimeCompatibility(manifest, futureRequirements);

console.log("\n=== verifyRuntimeCompatibility (future requirements) ===");
console.log("valid                      :", futureCompat.valid);
console.log("missing_capabilities       :", futureCompat.missing_capabilities);
console.log("unsupported_runtime_version:", futureCompat.unsupported_runtime_version);
console.log("unsupported_schema_version :", futureCompat.unsupported_schema_version);
