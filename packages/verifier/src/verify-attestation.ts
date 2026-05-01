import type {
  ExecutionAttestation,
} from "@pramanasystems/execution";

import type {
  Verifier,
} from "@pramanasystems/execution";

import {
  verifyExecutionResult,
} from "@pramanasystems/execution";

import {
  hashRuntime,
} from "@pramanasystems/execution";

import type {
  VerificationResult,
} from "./types";

export function verifyAttestation(
  attestation: ExecutionAttestation,
  verifier: Verifier
): VerificationResult {

  const signatureVerified =
    verifyExecutionResult(
      attestation.result,
      attestation.signature,
      verifier
    );

  const runtimeVerified =
    attestation.result.runtime_hash ===
    hashRuntime();

  const schemaCompatible =
    attestation.result.schema_version ===
    "1.0.0";

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
    },
  };
}




