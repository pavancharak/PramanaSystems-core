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
  "Attestation Lineage Conformance",
  () => {

    test(
      "execution attestations preserve governance lineage",
      () => {

        const execution =
          executeDecision({
            ...executionContext,

            token: {
              ...executionContext.token,

              execution_id:
                "attestation-lineage-1",
            },
          });

        expect(
          execution.result.execution_id
        ).toBe(
          "attestation-lineage-1"
        );

        expect(
          execution.result.policy_id
        ).toBe(
          "policy-1"
        );

        expect(
          execution.result.policy_version
        ).toBe(
          "1.0.0"
        );

        expect(
          execution.result.runtime_version
        ).toBe(
          "1.0.0"
        );

        expect(
          execution.signature
        ).toBeTruthy();
      }
    );
  }
);


