import {
  describe,
  expect,
  test,
} from "vitest";

import {
  executeDecision,
  verifyExecutionResult,
} from "@pramanasystems/core";

import {
  executionContext,
} from "../../fixtures/execution-context-fixture";

describe(
  "Portable Verification Conformance",
  () => {

    test(
      "execution artifacts remain independently verifiable",
      () => {

        const context = {
          ...executionContext,

          token: {
            ...executionContext.token,

            execution_id:
              "portable-verification-1",
          },
        };

        const execution =
          executeDecision(
            context
          );

        const verified =
          verifyExecutionResult(
            execution.result,
            execution.signature,
            executionContext.verifier
          );

        expect(
          verified
        ).toBe(
          true
        );
      }
    );
  }
);


