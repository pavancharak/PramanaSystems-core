# 07 — AWS KMS Signer

Async governance execution pipeline using AWS KMS (ECDSA_SHA_256) for signing.
Automatically skips if `AWS_KMS_KEY_ID` is not set in the environment.

## What it demonstrates

1. Skip gracefully when AWS credentials or `AWS_KMS_KEY_ID` are absent
2. Implement an async KMS signing pipeline using `@aws-sdk/client-kms`
3. Issue and sign an `ExecutionToken` asynchronously
4. Build an `ExecutionResult` and sign it with KMS
5. Verify the attestation using `GetPublicKey` + a local ECDSA verifier

## Run

```bash
export AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/...
export AWS_REGION=us-east-1
npx tsx examples/07-aws-kms-signer/aws-kms-signer.ts
```

## Prerequisites

- An AWS KMS asymmetric key with signing algorithm `ECDSA_SHA_256`
- AWS credentials in the environment (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`)
  or an IAM role / instance profile
- `kms:Sign` and `kms:GetPublicKey` permissions on the key

## Packages used

- `@pramanasystems/execution` — `issueExecutionToken`, `getRuntimeManifest`
- `@pramanasystems/verifier` — `verifyAttestation`
- `@aws-sdk/client-kms` — `KMSClient`, `SignCommand`, `GetPublicKeyCommand`
