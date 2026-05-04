import type {
  RuntimeManifest,
} from "@pramanasystems/execution";

/** Result of verifying that a runtime satisfies a set of execution security requirements. */
export interface ExecutionRequirementResult {
  /** `true` when the runtime satisfies all requirements. */
  valid: boolean;

  /** List of capability strings that are required but absent from the runtime. */
  missing_requirements: string[];
}

type ExecutionRequirementsInput = {
  replay_protection_required?: boolean;
  attestation_required?: boolean;
  audit_chain_required?: boolean;
  [key: string]: boolean | undefined;
};

/**
 * Checks that `manifest.capabilities` satisfies every flag set in
 * `requirements`.  Returns the list of missing capabilities so callers can
 * produce actionable error messages.
 *
 * @param manifest     - The runtime manifest to test.
 * @param requirements - The execution security requirements to check against.
 */
export function verifyExecutionRequirements(
  manifest: RuntimeManifest,
  requirements: ExecutionRequirementsInput
): ExecutionRequirementResult {

  const missing: string[] = [];

  if (
    requirements.replay_protection_required &&
    !manifest.capabilities.includes(
      "replay-protection"
    )
  ) {
    missing.push(
      "replay-protection"
    );
  }

  if (
    requirements.attestation_required &&
    !manifest.capabilities.includes(
      "attestation-signing"
    )
  ) {
    missing.push(
      "attestation-signing"
    );
  }

  if (
    requirements.audit_chain_required &&
    !manifest.capabilities.includes(
      "bundle-verification"
    )
  ) {
    missing.push(
      "bundle-verification"
    );
  }

  return {
    valid:
      missing.length === 0,

    missing_requirements:
      missing,
  };
}



