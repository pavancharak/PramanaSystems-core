import crypto from "crypto";

import path from "path";

import {
  readManifest,
} from "@pramanasystems/bundle";

import {
  validatePolicy,
} from "@pramanasystems/governance";

import type {
  ExecutionToken,
} from "./execution-token";

export function issueExecutionToken(
  policyId: string,
  policyVersion: string,
  decisionType: string,
  signalsHash: string,
  ttlSeconds = 300
): ExecutionToken {
  const valid =
    validatePolicy(
      policyId
    );

  if (!valid) {
    throw new Error(
      `Policy validation failed: ${policyId}`
    );
  }

  const manifest =
    readManifest(
      path.join(
        "./policies",
        policyId,
        policyVersion
      )
    );

  const issuedAt =
    new Date();

  const expiresAt =
    new Date(
      issuedAt.getTime() +
      ttlSeconds * 1000
    );

  return {
    execution_id:
      crypto.randomUUID(),

    policy_id:
      policyId,

    policy_version:
      policyVersion,

    bundle_hash:
      manifest.bundle_hash,

    decision_type:
      decisionType,

    signals_hash:
      signalsHash,

    issued_at:
      issuedAt
        .toISOString(),

    expires_at:
      expiresAt
        .toISOString(),
  };
}




