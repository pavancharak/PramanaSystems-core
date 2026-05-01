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
  verifyAttestation,
} from "@pramanasystems/verifier";

import {
  runtimeManifest,
  runtimeRequirements,
  executionRequirements,
} from "../../fixtures/execution-context-fixture";

const signer =
  new LocalSigner(
    fs.readFileSync(
      "./keys/bundle_signing_key",
      "utf8"
    )
  );

const verifier =
  new LocalVerifier(
    fs.readFileSync(
      "./keys/bundle_signing_key.pub",
      "utf8"
    )
  );

describe(
  "independent verifier",
  () => {

    test(
      "valid attestation verifies",
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

        const attestation =
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

        const result =
          verifyAttestation(
            attestation,
            verifier
          );

        expect(result.valid)
          .toBe(true);
      }
    );

    test(
      "tampered attestation fails verification",
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

        const attestation =
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

        attestation.result.decision =
          "deny-claim";

        const result =
          verifyAttestation(
            attestation,
            verifier
          );

        expect(result.valid)
          .toBe(false);
      }
    );
  }
);


