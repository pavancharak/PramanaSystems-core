import {
  describe,
  expect,
  test,
} from "vitest";

import {
  getRuntimeManifest,
} from "@pramanasystems/execution";

import {
  verifyRuntime,
} from "@pramanasystems/verifier";

describe(
  "runtime verifier",
  () => {

    test(
      "runtime satisfies required capabilities",
      () => {

        const manifest =
          getRuntimeManifest();

        const result =
          verifyRuntime(
            manifest,
            [
              "replay-protection",
              "attestation-signing",
            ]
          );

        expect(result.valid)
          .toBe(true);

        expect(
          result.missing_capabilities
        ).toHaveLength(0);
      }
    );

    test(
      "missing runtime capabilities fail verification",
      () => {

        const manifest =
          getRuntimeManifest();

        const result =
          verifyRuntime(
            manifest,
            [
              "non-existent-capability",
            ]
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



