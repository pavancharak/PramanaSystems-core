import {
  describe,
  expect,
  test,
} from "vitest";

import fs from "fs";
import path from "path";

describe(
  "Provenance Reconstruction Conformance",
  () => {

    test(
      "release provenance remains reconstructable",
      () => {

        const manifest =
          JSON.parse(
            fs.readFileSync(
              path.resolve(
                "release-manifest.json"
              ),
              "utf8"
            )
          );

        expect(
          manifest.manifest_version
        ).toBeTruthy();

        expect(
          manifest.generated_at
        ).toBeTruthy();

        expect(
          manifest.git_commit
        ).toBeTruthy();

        expect(
          manifest.artifacts
        ).toBeTruthy();

        expect(
          Array.isArray(
            manifest.artifacts
          )
        ).toBe(
          true
        );

        expect(
          manifest.artifacts.length
        ).toBeGreaterThan(
          0
        );

        for (const artifact of manifest.artifacts) {

          expect(
            artifact.package
          ).toBeTruthy();

          expect(
            artifact.artifact
          ).toBeTruthy();

          expect(
            artifact.sha256
          ).toBeTruthy();
        }
      }
    );
  }
);



