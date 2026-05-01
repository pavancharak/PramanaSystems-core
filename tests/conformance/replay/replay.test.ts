import fs from "fs";

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  issueExecutionToken,

  signExecutionToken,

  executeDecision,

  LocalSigner,

  LocalVerifier,
} from "@pramanasystems/execution";

import {
  runtimeManifest,
  runtimeRequirements,
  executionRequirements,
} from "../../fixtures/execution-context-fixture";

const signer =
  new LocalSigner(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key",
      "utf8"
    )
  );

const verifier =
  new LocalVerifier(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key.pub",
      "utf8"
    )
  );

describe(
  "replay protection",
  () => {
    test(
      "same token cannot execute twice",
      () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "approve-claim",
            "signals-hash-example"
          );

        const signature =
          signExecutionToken(
            token,
            signer
          );

        executeDecision({
          token,

          token_signature:
            signature,

          signer,

          verifier,

          runtime_manifest:
            runtimeManifest,

          runtime_requirements:
            runtimeRequirements,

          execution_requirements:
            executionRequirements,
        });

        expect(() =>
          executeDecision({
            token,

            token_signature:
              signature,

            signer,

            verifier,

            runtime_manifest:
              runtimeManifest,

            runtime_requirements:
              runtimeRequirements,

            execution_requirements:
              executionRequirements,
          })
        ).toThrow(
          "Replay attack detected"
        );
      }
    );
  }
);



