import {
  getRuntimeManifest,
} from "@pramanasystems/execution";

import type {
  RuntimeRequirements,
  ExecutionRequirements,
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

export const executionRequirements: ExecutionRequirements = {
  replay_protection_required: true,

  attestation_required: true,

  audit_chain_required: true,

  independent_verification_required: true,
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

export const signer = {
  sign() {
    return "signed";
  },
};

export const verifier = {
  verify() {
    return true;
  },
};

export const executionContext = {
  token:
    executionToken,

  token_signature:
    "signature",

  signer,

  verifier,

  runtime_manifest:
    runtimeManifest,

  runtime_requirements:
    runtimeRequirements,

  execution_requirements:
    executionRequirements,
};


