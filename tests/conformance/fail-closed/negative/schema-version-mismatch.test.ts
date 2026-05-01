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
  "Schema Compatibility Negative Conformance",
  () => {
    test(
      "unsupported schema versions fail closed",
      () => {

        const replayStore =
          new MemoryReplayStore();

        const context = {
          ...executionContext,

          runtime_requirements: {
            ...executionContext.runtime_requirements,

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
          "Unsupported schema version"
        );
      }
    );
  }
);



