import crypto from "crypto";

import {
  beforeAll,
  describe,
  expect,
  test,
} from "vitest";

import {
  KMSClient,
  GetPublicKeyCommand,
} from "@aws-sdk/client-kms";

import {
  issueExecutionToken,
  verifyExecutionResult,
  getRuntimeManifest,
  hashRuntime,
  MemoryReplayStore,
  type Verifier,
  type ExecutionResult,
  type ExecutionAttestation,
} from "@pramanasystems/execution";

// AwsKmsSigner is intentionally not re-exported from the package index;
// import directly from the implementation module.
import {
  AwsKmsSigner,
} from "../../../packages/execution/src/aws-kms-signer.js";

import {
  verifyAttestation,
} from "@pramanasystems/verifier";

import {
  canonicalize,
} from "@pramanasystems/bundle";

// ── Skip guard ────────────────────────────────────────────────────────────
// All tests are skipped unless real AWS credentials and a KMS key are
// present in the environment.  Set these before running:
//   AWS_KMS_KEY_ID, AWS_ACCESS_KEY_ID (or AWS_PROFILE), AWS_REGION

const missingCredentials =
  !process.env.AWS_KMS_KEY_ID ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_REGION;

// ── KMS-compatible verifier ───────────────────────────────────────────────
// LocalVerifier uses Ed25519 (algorithm=null).  AWS KMS uses ECDSA_SHA_256
// so we need to pass 'SHA256' explicitly to crypto.verify.

class KmsEcdsaVerifier implements Verifier {

  constructor(
    private readonly publicKeyDer: Buffer
  ) {}

  verify(
    payload: string,
    signature: string
  ): boolean {

    const key =
      crypto.createPublicKey({
        key:    this.publicKeyDer,
        format: "der",
        type:   "spki",
      });

    return crypto.verify(
      "SHA256",
      Buffer.from(payload, "utf8"),
      key,
      Buffer.from(signature, "base64")
    );
  }
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe.skipIf(missingCredentials)(
  "AWS KMS integration",
  () => {

    const keyId =
      process.env.AWS_KMS_KEY_ID!;

    const region =
      process.env.AWS_REGION!;

    let kmsSigner:   AwsKmsSigner;
    let kmsVerifier: KmsEcdsaVerifier;

    beforeAll(async () => {

      kmsSigner =
        new AwsKmsSigner(
          keyId,
          region
        );

      const client =
        new KMSClient({ region });

      const { PublicKey } =
        await client.send(
          new GetPublicKeyCommand({
            KeyId: keyId,
          })
        );

      if (!PublicKey) {
        throw new Error(
          "KMS GetPublicKey returned no key material"
        );
      }

      kmsVerifier =
        new KmsEcdsaVerifier(
          Buffer.from(PublicKey)
        );
    });

    // ── 1. Raw sign + verify roundtrip ──────────────────────────────────

    test(
      "signs a payload and verifies the signature",
      async () => {

        const payload =
          "pramana-kms-integration-payload";

        const signature =
          await kmsSigner.sign(payload);

        expect(typeof signature)
          .toBe("string");

        expect(signature.length)
          .toBeGreaterThan(0);

        expect(
          kmsVerifier.verify(payload, signature)
        ).toBe(true);
      }
    );

    // ── 2. Signature is payload-specific ───────────────────────────────

    test(
      "different payloads produce signatures that do not cross-verify",
      async () => {

        const sigA =
          await kmsSigner.sign("payload-alpha");

        const sigB =
          await kmsSigner.sign("payload-beta");

        // Each signature only verifies against its own payload.
        expect(kmsVerifier.verify("payload-alpha", sigA)).toBe(true);
        expect(kmsVerifier.verify("payload-beta",  sigB)).toBe(true);

        // Cross-verification must fail.
        expect(kmsVerifier.verify("payload-beta",  sigA)).toBe(false);
        expect(kmsVerifier.verify("payload-alpha", sigB)).toBe(false);
      }
    );

    // ── 3. Tampered payload is rejected ────────────────────────────────

    test(
      "signature does not verify against a tampered payload",
      async () => {

        const original =
          "original-governance-payload";

        const signature =
          await kmsSigner.sign(original);

        expect(
          kmsVerifier.verify("tampered-governance-payload", signature)
        ).toBe(false);
      }
    );

    // ── 4. execute() with AwsKmsSigner ─────────────────────────────────
    // executeDecision() requires a synchronous Signer; AwsKmsSigner is an
    // AsyncSigner.  This test replicates executeDecision's steps using async
    // KMS signing so the full governance pipeline is exercised with real KMS
    // key material.

    test(
      "executes a governance decision using AwsKmsSigner",
      async () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "approve-claim",
            "kms-integration-signals-hash"
          );

        // Sign the execution token with KMS.
        const tokenCanonical =
          canonicalize(token);

        const tokenSignature =
          await kmsSigner.sign(tokenCanonical);

        expect(
          kmsVerifier.verify(tokenCanonical, tokenSignature)
        ).toBe(true);

        // Build the execution result — the deterministic governance output.
        const result: ExecutionResult = {
          execution_id:   token.execution_id,
          policy_id:      token.policy_id,
          policy_version: token.policy_version,
          schema_version: "1.0.0",
          runtime_version:"1.0.0",
          runtime_hash:   hashRuntime(),
          decision:       token.decision_type,
          signals_hash:   token.signals_hash,
          executed_at:    new Date().toISOString(),
        };

        // Sign the execution result with KMS.
        const resultSignature =
          await kmsSigner.sign(
            canonicalize(result)
          );

        const attestation: ExecutionAttestation = {
          result,
          signature: resultSignature,
        };

        // Verify result signature via the execution package primitive.
        expect(
          verifyExecutionResult(
            attestation.result,
            attestation.signature,
            kmsVerifier
          )
        ).toBe(true);
      }
    );

    // ── 5. Attestation verification via @pramanasystems/verifier ───────

    test(
      "KMS-signed attestation passes full verifier checks",
      async () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "approve-claim",
            "kms-verifier-signals-hash"
          );

        const result: ExecutionResult = {
          execution_id:   token.execution_id,
          policy_id:      token.policy_id,
          policy_version: token.policy_version,
          schema_version: "1.0.0",
          runtime_version:"1.0.0",
          runtime_hash:   hashRuntime(),
          decision:       token.decision_type,
          signals_hash:   token.signals_hash,
          executed_at:    new Date().toISOString(),
        };

        const signature =
          await kmsSigner.sign(
            canonicalize(result)
          );

        const attestation: ExecutionAttestation = {
          result,
          signature,
        };

        const manifest =
          getRuntimeManifest();

        const verification =
          verifyAttestation(
            attestation,
            kmsVerifier,
            manifest
          );

        expect(verification.valid)
          .toBe(true);

        expect(verification.checks.signature_verified)
          .toBe(true);

        expect(verification.checks.runtime_verified)
          .toBe(true);

        expect(verification.checks.schema_compatible)
          .toBe(true);
      }
    );

    // ── 6. Tampered attestation is detected ────────────────────────────

    test(
      "tampered attestation fails independent verification",
      async () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "deny-claim",
            "tamper-test-signals-hash"
          );

        const result: ExecutionResult = {
          execution_id:   token.execution_id,
          policy_id:      token.policy_id,
          policy_version: token.policy_version,
          schema_version: "1.0.0",
          runtime_version:"1.0.0",
          runtime_hash:   hashRuntime(),
          decision:       token.decision_type,
          signals_hash:   token.signals_hash,
          executed_at:    new Date().toISOString(),
        };

        // Sign the original result.
        const signature =
          await kmsSigner.sign(
            canonicalize(result)
          );

        // Mutate the decision after signing — simulating attestation tampering.
        const tampered: ExecutionAttestation = {
          result: {
            ...result,
            decision: "approve-claim",
          },
          signature,
        };

        const manifest =
          getRuntimeManifest();

        const verification =
          verifyAttestation(
            tampered,
            kmsVerifier,
            manifest
          );

        expect(verification.valid)
          .toBe(false);

        expect(verification.checks.signature_verified)
          .toBe(false);
      }
    );

    // ── 7. Replay protection is enforced ───────────────────────────────

    test(
      "MemoryReplayStore rejects a duplicate execution ID",
      async () => {

        const token =
          issueExecutionToken(
            "claims-approval",
            "v1",
            "approve-claim",
            "replay-test-signals-hash"
          );

        const store =
          new MemoryReplayStore();

        // First execution is accepted.
        store.markExecuted(
          token.execution_id
        );

        expect(
          store.hasExecuted(
            token.execution_id
          )
        ).toBe(true);

        // Sign a second attestation for the same execution ID.
        const result: ExecutionResult = {
          execution_id:   token.execution_id,
          policy_id:      token.policy_id,
          policy_version: token.policy_version,
          schema_version: "1.0.0",
          runtime_version:"1.0.0",
          runtime_hash:   hashRuntime(),
          decision:       token.decision_type,
          signals_hash:   token.signals_hash,
          executed_at:    new Date().toISOString(),
        };

        await kmsSigner.sign(
          canonicalize(result)
        );

        // Replay store must reject the duplicate.
        expect(
          store.hasExecuted(
            token.execution_id
          )
        ).toBe(true);
      }
    );
  }
);
