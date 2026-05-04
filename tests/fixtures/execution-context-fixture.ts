import fs from "fs";

import {
  getRuntimeManifest,
  LocalSigner,
  LocalVerifier,
  signExecutionToken,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

export const runtimeManifest =
  getRuntimeManifest();

export const runtimeRequirements: RuntimeRequirements = {
  required_capabilities: [
    "replay-protection",
    "attestation-signing",
  ],

  supported_runtime_versions: [
    "1.0.0",
  ],

  supported_schema_versions: [
    "1.0.0",
  ],
};

export const executionToken = {
  execution_id:
    "test-execution-id",

  policy_id:
    "policy-1",

  policy_version:
    "1.0.0",

  bundle_hash:
    "bundle-hash-1",

  decision_type:
    "approve",

  signals_hash:
    "signals-hash",

  issued_at:
    new Date().toISOString(),

  expires_at:
    new Date(
      Date.now() + 60000
    ).toISOString(),
};

export const signer =
  new LocalSigner(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key",
      "utf8"
    )
  );

export const verifier =
  new LocalVerifier(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key.pub",
      "utf8"
    )
  );

export const tokenSignature =
  signExecutionToken(
    executionToken,
    signer
  );

export const executionContext = {
  token:
    executionToken,

  token_signature:
    tokenSignature,

  signer,

  verifier,

  runtime_manifest:
    runtimeManifest,

  runtime_requirements:
    runtimeRequirements,
};



