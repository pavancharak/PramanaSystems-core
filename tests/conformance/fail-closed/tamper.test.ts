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
  validatePolicy,
} from "@pramanasystems/governance";

const policyFile =
  path.resolve(
    "./policies/claims-approval/v1/policy.json"
  );

let originalContent = "";

describe(
  "tamper detection",
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
      "tampered policy fails validation",
      () => {
        fs.writeFileSync(
          policyFile,

          JSON.stringify(
            {
              policy:
                "claims-approval",

              version:
                "tampered"
            },
            null,
            2
          ),

          "utf8"
        );

        const valid =
          validatePolicy(
            "claims-approval"
          );

        expect(valid)
          .toBe(false);
      }
    );
  }
);



