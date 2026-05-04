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
  "Missing Attestation Negative Conformance",
  () => {
    test(
      "governance is structurally enforced — executeDecision always produces governed: true",
      () => {
        const replayStore =
          new MemoryReplayStore();

        // ExecutionRequirements has been removed. Attestation issuance is now
        // structurally enforced inside executeDecision — not configurable.
        // governed: true is always present in every ExecutionResult.
        const attestation =
          executeDecision(
            executionContext,
            replayStore
          );

        expect(attestation.result.governed)
          .toBe(true);

        expect(typeof attestation.signature)
          .toBe("string");

        expect(attestation.signature.length)
          .toBeGreaterThan(0);
      }
    );
  }
);



