# AWS KMS Integration Tests

These tests run the PramanaSystems governance execution pipeline against a **real AWS KMS key**. No mocking — every `sign()` call hits the KMS API.

All tests are skipped automatically when the required environment variables are absent, so they are safe to run in CI without AWS credentials.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| AWS account | Any region that supports KMS asymmetric signing |
| KMS asymmetric key | Key spec `ECC_NIST_P256`, key usage `SIGN_VERIFY` |
| IAM permissions | `kms:Sign`, `kms:GetPublicKey` on the key |
| Node.js ≥ 20 | Already required by the monorepo |

### Create the KMS key (AWS CLI)

```bash
aws kms create-key \
  --key-spec ECC_NIST_P256 \
  --key-usage SIGN_VERIFY \
  --description "PramanaSystems integration test key" \
  --region us-east-1
```

The response contains a `KeyId` (UUID) and `KeyArn`. Either can be used as `AWS_KMS_KEY_ID`.

---

## Required environment variables

| Variable | Description |
|---|---|
| `AWS_KMS_KEY_ID` | KMS key ID or ARN (`arn:aws:kms:…` or UUID) |
| `AWS_ACCESS_KEY_ID` | AWS access key (or use `AWS_PROFILE` instead) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (required if using `AWS_ACCESS_KEY_ID`) |
| `AWS_REGION` | AWS region where the key lives, e.g. `us-east-1` |

---

## Running the tests

### Option A — inline environment variables

```bash
AWS_KMS_KEY_ID=<key-id> \
AWS_ACCESS_KEY_ID=<access-key> \
AWS_SECRET_ACCESS_KEY=<secret-key> \
AWS_REGION=us-east-1 \
npx vitest run tests/integration/aws-kms
```

### Option B — named AWS profile

```bash
AWS_KMS_KEY_ID=<key-id> \
AWS_PROFILE=my-profile \
AWS_REGION=us-east-1 \
npx vitest run tests/integration/aws-kms
```

### Option C — `.env` file (local dev only, do not commit)

Create `tests/integration/aws-kms/.env.local` (already in `.gitignore`):

```
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

Then load it before running:

```bash
export $(grep -v '^#' tests/integration/aws-kms/.env.local | xargs)
npx vitest run tests/integration/aws-kms
```

---

## What the tests cover

| Test | What it validates |
|---|---|
| Raw sign + verify roundtrip | `AwsKmsSigner.sign()` returns a valid ECDSA-SHA256 signature |
| Cross-payload verification | Signatures are payload-specific; cross-verification fails |
| Tampered payload rejection | Modified payload invalidates the original signature |
| execute() with AwsKmsSigner | Full governance execution — issue token, sign with KMS, build attestation |
| Full verifier checks | `verifyAttestation()` passes all three checks against a KMS-signed attestation |
| Tampered attestation detection | Mutating `decision` after signing causes `signature_verified: false` |
| Replay protection | `MemoryReplayStore` rejects duplicate execution IDs even with fresh KMS signatures |

### Why `executeDecision()` is not called directly

`executeDecision()` (and `executeSimple()`) require a synchronous `Signer`. `AwsKmsSigner` implements `AsyncSigner` — its `sign()` method returns a `Promise`. These tests replicate the execution pipeline steps explicitly using `async/await` so that real KMS API calls can be made at each signing boundary.

---

## Skipping in CI

The `describe.skipIf` guard at the top of the test file skips the entire suite when `AWS_KMS_KEY_ID`, `AWS_ACCESS_KEY_ID`, or `AWS_REGION` are absent. Running `npm test` or `vitest run` without those variables set produces:

```
↓ AWS KMS integration (skipped)
```

No failures, no noise.

---

## IAM policy (minimum required permissions)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Sign",
        "kms:GetPublicKey"
      ],
      "Resource": "arn:aws:kms:<region>:<account-id>:key/<key-id>"
    }
  ]
}
```
