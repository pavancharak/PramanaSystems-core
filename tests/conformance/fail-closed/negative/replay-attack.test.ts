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
  "Replay Protection Negative Conformance",
  () => {
    test(
      "duplicate executions fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        executeDecision(
          executionContext,
          replayStore
        );

        expect(() =>
          executeDecision(
            executionContext,
            replayStore
          )
        ).toThrow(
          "Replay attack detected"
        );
      }
    );
  }
);



