import {
  describe,
  expect,
  test,
} from "vitest";

import {
  createPolicy,
} from "@pramanasystems/governance";

describe(
  "immutable version enforcement",
  () => {
    test(
      "existing policy cannot be recreated",
      () => {
        expect(() =>
          createPolicy(
            "claims-approval"
          )
        ).toThrow();
      }
    );
  }
);



