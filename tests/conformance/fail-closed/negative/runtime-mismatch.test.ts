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
  "Runtime Compatibility Negative Conformance",
  () => {
    test(
      "incompatible runtime versions fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        const context = {
          ...executionContext,

          runtime_manifest: {
            ...executionContext.runtime_manifest,

            runtime_version:
              "1.0.0",
          },

          runtime_requirements: {
            required_capabilities: [
              "replay-protection",
            ],

            supported_runtime_versions: [
              "999.0.0",
            ],

            supported_schema_versions: [
              "999.0.0",
            ],
          },
        };

        expect(() =>
          executeDecision(
            context,
            replayStore
          )
        ).toThrow(
          "Unsupported runtime version"
        );
      }
    );
  }
);



