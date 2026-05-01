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
  "Runtime Capability Negative Conformance",
  () => {
    test(
      "missing required runtime capabilities fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        const context = {
          ...executionContext,

          runtime_manifest: {
            ...executionContext.runtime_manifest,

            capabilities: [],
          },

          runtime_requirements: {
            ...executionContext.runtime_requirements,

            required_capabilities: [
              "replay-protection",
            ],
          },
        };

        expect(() =>
          executeDecision(
            context,
            replayStore
          )
        ).toThrow(
          "Missing runtime capability: replay-protection"
        );
      }
    );
  }
);



