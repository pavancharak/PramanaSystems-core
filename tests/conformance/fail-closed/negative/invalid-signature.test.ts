import {
  describe,
  expect,
  test,
} from "vitest";

import {
  executeDecision,
  MemoryReplayStore,
} from "@pramanasystems/execution";

import {
  executionContext,
} from "../../../fixtures/execution-context-fixture";

describe(
  "Invalid Signature Negative Conformance",
  () => {
    test(
      "invalid execution signatures fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        const context = {
          ...executionContext,

          verifier: {
            verify() {
              return false;
            },
          },
        };

        expect(() =>
          executeDecision(
            context,
            replayStore
          )
        ).toThrow(
          "Execution token verification failed"
        );
      }
    );
  }
);



