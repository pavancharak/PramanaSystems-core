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

  verifyExecutionResult,

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
  "execution attestation verification",
  () => {
    test(
      "signed execution attestation verifies",
      () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "approve-claim",
            "signals-hash-example"
          );

        const tokenSignature =
          signExecutionToken(
            token,
            signer
          );

        const attestation =
          executeDecision({
            token,

            token_signature:
              tokenSignature,

            signer,

            verifier,

            runtime_manifest:
              runtimeManifest,

            runtime_requirements:
              runtimeRequirements,

            execution_requirements:
              executionRequirements,
          });

        const valid =
          verifyExecutionResult(
            attestation.result,
            attestation.signature,
            verifier
          );

        expect(valid)
          .toBe(true);
      }
    );
  }
);



