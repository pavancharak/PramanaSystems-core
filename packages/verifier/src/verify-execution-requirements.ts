import type {
  RuntimeManifest,
} from "@pramanasystems/execution";

import type {
  ExecutionRequirements,
} from "@pramanasystems/governance";

export interface ExecutionRequirementResult {

  valid: boolean;

  missing_requirements: string[];
}

export function verifyExecutionRequirements(
  manifest: RuntimeManifest,
  requirements: ExecutionRequirements
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



