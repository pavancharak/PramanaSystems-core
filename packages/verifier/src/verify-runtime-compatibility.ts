import type {
  RuntimeManifest,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

export interface RuntimeCompatibilityResult {

  valid: boolean;

  missing_capabilities: string[];

  unsupported_runtime_version: boolean;

  unsupported_schema_version: boolean;
}

export function verifyRuntimeCompatibility(
  manifest: RuntimeManifest,
  requirements: RuntimeRequirements
): RuntimeCompatibilityResult {

  const missingCapabilities =
    requirements.required_capabilities.filter(
      capability =>
        !manifest.capabilities.includes(
          capability
        )
    );

  const unsupportedRuntime =
    !requirements.supported_runtime_versions.includes(
      manifest.runtime_version
    );

  const unsupportedSchema =
    !requirements.supported_schema_versions.includes(
      "1.0.0"
    );

  return {
    valid:
      missingCapabilities.length === 0 &&
      !unsupportedRuntime &&
      !unsupportedSchema,

    missing_capabilities:
      missingCapabilities,

    unsupported_runtime_version:
      unsupportedRuntime,

    unsupported_schema_version:
      unsupportedSchema,
  };
}



