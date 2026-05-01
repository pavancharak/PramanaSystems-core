import type {
  RuntimeManifest,
} from "@pramanasystems/execution";

export interface RuntimeVerificationResult {
  valid: boolean;

  missing_capabilities: string[];
}

export function verifyRuntime(
  manifest: RuntimeManifest,
  requiredCapabilities: string[]
): RuntimeVerificationResult {

  const missing =
    requiredCapabilities.filter(
      capability =>
        !manifest.capabilities.includes(
          capability
        )
    );

  return {
    valid:
      missing.length === 0,

    missing_capabilities:
      missing,
  };
}




