import type {
  ExecutionAttestation,
  RuntimeManifest,
} from "@pramanasystems/execution";

import type {
  Verifier,
} from "@pramanasystems/execution";

import {
  verifyExecutionResult,
} from "@pramanasystems/execution";

import type {
  VerificationResult,
} from "./types";

/**
 * Verifies an ExecutionAttestation against a trusted runtime manifest.
 *
 * Performs four independent checks in order:
 *
 * 1. Governed — attestation.result.governed must be the literal true.
 *    A missing or false governed field means this was not produced by
 *    a governed execution path. Rejected immediately.
 *
 * 2. Signature — cryptographic verification of attestation.signature
 *    over the canonical form of attestation.result.
 *
 * 3. Runtime — result.runtime_hash and result.runtime_version must
 *    match runtimeManifest.
 *
 * 4. Schema — result.schema_version must be in
 *    runtimeManifest.supported_schema_versions.
 *
 * All four must pass for valid to be true.
 *
 * Enforces: META-001, INV-008, INV-014, INV-033, INV-035.
 *
 * @param attestation     - The attestation to verify.
 * @param verifier        - Verifier holding the signing authority public key.
 * @param runtimeManifest - The trusted runtime manifest to compare against.
 */
export function verifyAttestation(
  attestation: ExecutionAttestation,
  verifier: Verifier,
  runtimeManifest: RuntimeManifest
): VerificationResult {

  // Check 1: governed field must be the literal true.
  // Enforces META-001 — governance invariants are structural, not optional.
  // A DryRunResult has governed: false and must never pass this check.
  if (attestation.result.governed !== true) {
    return {
      valid: false,
      checks: {
        signature_verified: false,
        runtime_verified: false,
        schema_compatible: false,
        governed: false,
      },
    };
  }

  // Check 2: cryptographic signature over canonical result bytes.
  const signatureVerified =
    verifyExecutionResult(
      attestation.result,
      attestation.signature,
      verifier
    );

  // Check 3: runtime identity binding.
  const runtimeVerified =
    attestation.result.runtime_hash ===
      runtimeManifest.runtime_hash &&
    attestation.result.runtime_version ===
      runtimeManifest.runtime_version;

  // Check 4: schema version compatibility.
  const schemaCompatible =
    runtimeManifest
      .supported_schema_versions
      .includes(
        attestation.result.schema_version
      );

  return {
    valid:
      signatureVerified &&
      runtimeVerified &&
      schemaCompatible,

    checks: {
      signature_verified:
        signatureVerified,

      runtime_verified:
        runtimeVerified,

      schema_compatible:
        schemaCompatible,

      governed:
        true,
    },
  };
}



