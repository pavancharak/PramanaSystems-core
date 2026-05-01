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
  "Expired Token Negative Conformance",
  () => {
    test(
      "expired execution tokens fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        const context = {
          ...executionContext,

          token: {
            ...executionContext.token,

            expires_at:
              new Date(
                Date.now() - 60000
              ).toISOString(),
          },
        };

        expect(() =>
          executeDecision(
            context,
            replayStore
          )
        ).toThrow(
          "Execution token expired"
        );
      }
    );
  }
);



