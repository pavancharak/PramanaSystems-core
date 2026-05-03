/**
 * 07 — AWS KMS Signer
 *
 * Async governance execution pipeline using AWS KMS (ECDSA_SHA_256) for signing.
 * Skips gracefully when AWS_KMS_KEY_ID is not set in the environment.
 *
 * Prerequisites:
 *   - AWS KMS asymmetric key with ECDSA_SHA_256 signing algorithm
 *   - AWS credentials in environment or IAM role
 *   - kms:Sign and kms:GetPublicKey permissions
 *
 * Run from the repository root:
 *   export AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/...
 *   npx tsx examples/07-aws-kms-signer/aws-kms-signer.ts
 */

import crypto from "crypto";

import {
  KMSClient,
  SignCommand,
  GetPublicKeyCommand,
} from "@aws-sdk/client-kms";

import {
  issueExecutionToken,
  getRuntimeManifest,
} from "@pramanasystems/execution";

import {
  canonicalize,
} from "@pramanasystems/bundle";

// ── Guard: skip if no KMS key configured ──────────────────────────────────────
const KEY_ID = process.env["AWS_KMS_KEY_ID"];
const REGION = process.env["AWS_REGION"] ?? "us-east-1";

if (!KEY_ID) {
  console.log("AWS_KMS_KEY_ID is not set — skipping KMS example.");
  console.log("Set it to a ECDSA_SHA_256 KMS key ARN to run this example.");
  process.exit(0);
}

const kms = new KMSClient({ region: REGION });

// ── Async KMS signing helper ──────────────────────────────────────────────────
// AwsKmsSigner is intentionally not re-exported from @pramanasystems/execution,
// so we implement the same pattern here using @aws-sdk/client-kms directly.
async function kmsSign(payload: string): Promise<string> {
  const command = new SignCommand({
    KeyId:            KEY_ID!,
    Message:          Buffer.from(payload),
    SigningAlgorithm: "ECDSA_SHA_256",
    MessageType:      "RAW",
  });

  const response = await kms.send(command);

  if (!response.Signature) {
    throw new Error("KMS signing failed: empty Signature in response");
  }

  return Buffer.from(response.Signature).toString("base64");
}

// ── 1. Fetch the KMS public key ───────────────────────────────────────────────
console.log("=== KMS Setup ===");
console.log("key_id :", KEY_ID);
console.log("region :", REGION);

const pkResponse = await kms.send(new GetPublicKeyCommand({ KeyId: KEY_ID }));
if (!pkResponse.PublicKey) throw new Error("GetPublicKey returned no key material");

const derPublicKey = Buffer.from(pkResponse.PublicKey);
const spkiPem = `-----BEGIN PUBLIC KEY-----\n${derPublicKey.toString("base64").match(/.{1,64}/g)!.join("\n")}\n-----END PUBLIC KEY-----\n`;

console.log("public key (SPKI PEM):\n" + spkiPem);

// ── 2. Hash the signals payload ───────────────────────────────────────────────
const signals     = { account_age_days: 730, transaction_amount: 850, country_risk: "low" };
const signalsHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(signals))
  .digest("hex");

// ── 3. Issue an execution token ───────────────────────────────────────────────
const token = issueExecutionToken(
  "claims-approval",
  "v1",
  "approve",
  signalsHash
);

console.log("\n=== ExecutionToken ===");
console.log("execution_id  :", token.execution_id);
console.log("policy_id     :", token.policy_id);
console.log("signals_hash  :", signalsHash.slice(0, 16) + "…");

// ── 4. Sign the token with KMS ────────────────────────────────────────────────
const canonicalToken   = canonicalize(token);
const tokenSignature   = await kmsSign(canonicalToken);

console.log("\n=== Token Signature (KMS ECDSA) ===");
console.log("token_signature :", tokenSignature.slice(0, 32) + "…");

// ── 5. Build and sign the ExecutionResult ────────────────────────────────────
const manifest = getRuntimeManifest();

const executionResult = {
  execution_id:    token.execution_id,
  policy_id:       token.policy_id,
  policy_version:  token.policy_version,
  schema_version:  "1.0.0",
  runtime_version: manifest.runtime_version,
  runtime_hash:    manifest.runtime_hash,
  decision:        token.decision_type,
  signals_hash:    token.signals_hash,
  executed_at:     new Date().toISOString(),
};

const canonicalResult = canonicalize(executionResult);
const resultSignature = await kmsSign(canonicalResult);

const attestation = {
  result:    executionResult,
  signature: resultSignature,
};

console.log("\n=== ExecutionAttestation (KMS signed) ===");
console.log("execution_id  :", attestation.result.execution_id);
console.log("decision      :", attestation.result.decision);
console.log("executed_at   :", attestation.result.executed_at);
console.log("runtime_hash  :", attestation.result.runtime_hash.slice(0, 16) + "…");
console.log("signature     :", attestation.signature.slice(0, 32) + "…");

// ── 6. Verify the signature using the KMS public key ─────────────────────────
// Node.js crypto.verify handles the SPKI DER public key that KMS exports.
// KMS ECDSA_SHA_256 produces DER-encoded signatures (not raw r||s).
const sigBuffer    = Buffer.from(attestation.signature, "base64");
const payloadBytes = Buffer.from(canonicalResult);

const isValid = crypto.verify(
  "SHA256",
  payloadBytes,
  { key: spkiPem, dsaEncoding: "der" },
  sigBuffer
);

console.log("\n=== Signature Verification ===");
console.log("valid (KMS ECDSA) :", isValid);
