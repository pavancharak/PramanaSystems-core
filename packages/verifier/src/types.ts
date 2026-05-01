export interface VerificationResult {
  valid: boolean;

  checks: {
    signature_verified: boolean;

    runtime_verified: boolean;

    schema_compatible: boolean;
  };
}




