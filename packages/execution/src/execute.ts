import type {
  ExecutionContext,
} from "./execution-context";

import type {
  ExecutionResult,
} from "./execution-result";

import type {
  ExecutionAttestation,
} from "./execution-attestation";

import type {
  ReplayStore,
} from "./replay-store-interface";

import {
  appendAuditRecord,
} from "./audit";

import {
  hashRuntime,
} from "./hash-runtime";

import {
  MemoryReplayStore,
} from "./memory-replay-store";

import {
  signExecutionResult,
} from "./sign-execution-result";

import {
  verifyExecutionToken,
} from "./verify-token";

const defaultReplayStore =
  new MemoryReplayStore();

export function executeDecision(
  context: ExecutionContext,
  replayStore: ReplayStore =
    defaultReplayStore
): ExecutionAttestation {

  const {
    token,
    token_signature,
    signer,
    verifier,
    runtime_manifest,
    runtime_requirements,
    execution_requirements,
  } = context;

  if (
    !runtime_requirements
      .supported_runtime_versions
      .includes(
        runtime_manifest.runtime_version
      )
  ) {
    throw new Error(
      "Unsupported runtime version"
    );
  }

  if (
    !runtime_requirements
      .supported_schema_versions
      .includes(
        "1.0.0"
      )
  ) {
    throw new Error(
      "Unsupported schema version"
    );
  }

  for (
    const capability of
    runtime_requirements
      .required_capabilities
  ) {
    if (
      !runtime_manifest.capabilities
        .includes(capability)
    ) {
      throw new Error(
        `Missing runtime capability: ${capability}`
      );
    }
  }

  const valid =
    verifyExecutionToken(
      token,
      token_signature,
      verifier
    );

  if (!valid) {
    throw new Error(
      "Execution token verification failed"
    );
  }

  const now =
    Date.now();

  const expiration =
    new Date(
      token.expires_at
    ).getTime();

  if (now > expiration) {
    throw new Error(
      "Execution token expired"
    );
  }

  const executionId =
    token.execution_id;

  if (
    replayStore.hasExecuted(
      executionId
    )
  ) {
    throw new Error(
      "Replay attack detected"
    );
  }

  replayStore.markExecuted(
    executionId
  );

  appendAuditRecord(
    token
  );

  const result: ExecutionResult = {
    execution_id:
      token.execution_id,

    policy_id:
      token.policy_id,

    policy_version:
      token.policy_version,

    schema_version:
      "1.0.0",

    runtime_version:
      "1.0.0",

    runtime_hash:
      hashRuntime(),

    decision:
      token.decision_type,

    signals_hash:
      token.signals_hash,

    executed_at:
      new Date()
        .toISOString(),
  };

  const executionSignature =
    signExecutionResult(
      result,
      signer
    );

  const attestation: ExecutionAttestation = {
    result,

    signature:
      executionSignature,
  };

  return attestation;
}




