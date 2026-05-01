import {
  describe,
  expect,
  test,
} from "vitest";

import {
  executeDecision,
} from "@pramanasystems/core";

import {
  executionContext,
} from "../../fixtures/execution-context-fixture";

describe(
  "Fail-Closed Conformance",
  () => {

    test(
      "invalid governance execution fails closed",
      () => {

        expect(() =>
          executeDecision({
            ...executionContext,

            token:
              undefined as any,
          })
        ).toThrow();
      }
    );
  }
);


