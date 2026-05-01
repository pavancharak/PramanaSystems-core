import fs from "fs";
import path from "path";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import {
  readManifest,
  verifyManifest,
} from "@pramanasystems/bundle";

import {
  readSignature,
  verifySignature,
} from "@pramanasystems/crypto";

const policyDirectory =
  path.resolve(
    "./policies/claims-approval/v1"
  );

const policyFile =
  path.join(
    policyDirectory,
    "policy.json"
  );

const manifestPath =
  path.join(
    policyDirectory,
    "bundle.manifest.json"
  );

let originalContent = "";

describe(
  "signature verification",
  () => {

    beforeEach(() => {

      originalContent =
        fs.readFileSync(
          policyFile,
          "utf8"
        );
    });

    afterEach(() => {

      fs.writeFileSync(
        policyFile,
        originalContent,
        "utf8"
      );
    });

    test(
      "committed signature validates committed manifest",
      () => {

        readManifest(
          policyDirectory
        );

        const signature =
          readSignature(
            policyDirectory
          );

        const valid =
          verifySignature(
            manifestPath,
            signature
          );

        expect(valid)
          .toBe(true);
      }
    );

    test(
      "manifest integrity fails after mutation",
      () => {

        fs.writeFileSync(
          policyFile,

          JSON.stringify(
            {
              policy:
                "claims-approval",

              version:
                "mutated"
            },
            null,
            2
          ),

          "utf8"
        );

        const manifest =
          readManifest(
            policyDirectory
          );

        const result =
          verifyManifest(
            manifest,
            policyDirectory
          );

        expect(
          result.valid
        ).toBe(false);
      }
    );
  }
);



