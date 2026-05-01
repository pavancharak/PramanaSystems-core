
import {
  describe,
  expect,
  test,
} from "vitest";

import {
  getRuntimeManifest,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

import {
  verifyRuntimeCompatibility,
} from "@pramanasystems/verifier";

describe(
  "runtime compatibility verification",
  () => {

    test(
      "compatible runtime passes verification",
      () => {

        const manifest =
          getRuntimeManifest();

        const requirements: RuntimeRequirements = {
          required_capabilities: [
            "replay-protection",
            "attestation-signing",
          ],

          supported_runtime_versions: [
            "1.0.0",
          ],

          supported_schema_versions: [
            "1.0.0",
          ],
        };

        const result =
          verifyRuntimeCompatibility(
            manifest,
            requirements
          );

        expect(result.valid)
          .toBe(true);
      }
    );

    test(
      "missing capability fails verification",
      () => {

        const manifest =
          getRuntimeManifest();

        const requirements: RuntimeRequirements = {
          required_capabilities: [
            "non-existent-capability",
          ],

          supported_runtime_versions: [
            "1.0.0",
          ],

          supported_schema_versions: [
            "1.0.0",
          ],
        };

        const result =
          verifyRuntimeCompatibility(
            manifest,
            requirements
          );

        expect(result.valid)
          .toBe(false);

        expect(
          result.missing_capabilities
        ).toContain(
          "non-existent-capability"
        );
      }
    );
  }
);



