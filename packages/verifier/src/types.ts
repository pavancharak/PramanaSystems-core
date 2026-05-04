/**
 * Structured result of an attestation verification.
 *
 * `valid` is `true` only when all four checks pass.  Individual check flags
 * allow callers to produce precise diagnostic messages on failure.
 */
export interface VerificationResult {
  /** `true` when all checks — governed, signature, runtime, and schema — pass. */
  valid: boolean;

  checks: {
    /** `true` when the attestation signature is cryptographically valid. */
    signature_verified: boolean;

    /** `true` when the attestation's runtime hash and version match the provided manifest. */
    runtime_verified: boolean;

    /** `true` when the attestation's schema version is supported by the runtime manifest. */
    schema_compatible: boolean;

    /**
     * True when attestation.result.governed === true.
     * A governed attestation must have this field as the literal true.
     * Enforces: META-001, INV-014.
     */
    governed: boolean;
  };
}



