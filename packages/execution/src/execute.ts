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

import type {
  Signer,
} from "./signer-interface";

import type {
  Verifier,
} from "./verifier-interface";

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

import {
  issueExecutionToken,
} from "./issue-token";

import {
  signExecutionToken,
} from "./sign-token";

import {
  getRuntimeManifest,
} from "./runtime-manifest";

function getMissingExecutionRequirements(
  capabilities: readonly string[],
  executionRequirements: ExecutionContext["execution_requirements"]
): string[] {
  const missing =
    new Set<string>();

  if (
    executionRequirements
      .replay_protection_required &&
    !capabilities.includes(
      "replay-protection"
    )
  ) {
    missing.add(
      "replay-protection"
    );
  }

  if (
    executionRequirements
      .attestation_required &&
    !capabilities.includes(
      "attestation-signing"
    )
  ) {
    missing.add(
      "attestation-signing"
    );
  }

  if (
    executionRequirements
      .audit_chain_required &&
    !capabilities.includes(
      "bundle-verification"
    )
  ) {
    missing.add(
      "bundle-verification"
    );
  }

  if (
    executionRequirements
      .independent_verification_required
  ) {
    if (
      !capabilities.includes(
        "attestation-signing"
      )
    ) {
      missing.add(
        "attestation-signing"
      );
    }

    if (
      !capabilities.includes(
        "bundle-verification"
      )
    ) {
      missing.add(
        "bundle-verification"
      );
    }
  }

  return [
    ...missing,
  ];
}

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

  if (
    !runtime_manifest
      .supported_schema_versions
      .includes(
        "1.0.0"
      )
  ) {
    throw new Error(
      "Unsupported runtime schema version"
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

  const missingExecutionRequirements =
    getMissingExecutionRequirements(
      runtime_manifest.capabilities,
      execution_requirements
    );

  if (
    missingExecutionRequirements.length >
    0
  ) {
    throw new Error(
      `Missing execution requirement: ${missingExecutionRequirements.join(", ")}`
    );
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

export function executeSimple(
  input: {
    policyId: string;
    policyVersion: string;
    decisionType: string;
    signalsHash: string;
  },
  signer: Signer,
  verifier: Verifier,
  store?: ReplayStore
): ExecutionAttestation {

  const token =
    issueExecutionToken(
      input.policyId,
      input.policyVersion,
      input.decisionType,
      input.signalsHash
    );

  const tokenSignature =
    signExecutionToken(
      token,
      signer
    );

  const runtimeManifest =
    getRuntimeManifest();

  const runtimeRequirements = {
    required_capabilities: [],

    supported_runtime_versions:
      ["1.0.0"],

    supported_schema_versions:
      ["1.0.0"],
  };

  const executionRequirements = {
    replay_protection_required:
      false,

    attestation_required:
      false,

    audit_chain_required:
      false,

    independent_verification_required:
      false,
  };

  const context: ExecutionContext = {
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
  };

  return executeDecision(
    context,
    store ||
      defaultReplayStore
  );
}




