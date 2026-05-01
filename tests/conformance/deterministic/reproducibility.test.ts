import {
  describe,
  expect,
  test,
} from "vitest";

import {
  readManifest,
} from "@pramanasystems/bundle";

describe(
  "deterministic reproducibility",
  () => {
    test(
      "committed bundle hash remains stable",
      () => {
        const manifest1 =
          readManifest(
            "./policies/claims-approval/v1"
          );

        const manifest2 =
          readManifest(
            "./policies/claims-approval/v1"
          );

        expect(
          manifest1.bundle_hash
        ).toBe(
          manifest2.bundle_hash
        );
      }
    );
  }
);


