import {
  validatePolicy,
} from "@pramanasystems/governance";

export function verifyRuntimePolicy(
  policyId: string
): void {
  const valid =
    validatePolicy(
      policyId
    );

  if (!valid) {
    throw new Error(
      `Runtime verification failed for policy: ${policyId}`
    );
  }
}




