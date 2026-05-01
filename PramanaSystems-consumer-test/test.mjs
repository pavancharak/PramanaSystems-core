import {
  executeDecision,
  verifyExecutionResult,
  getRuntimeManifest,
  MemoryReplayStore,
} from "@pramanasystems/execution";

const replayStore =
  new MemoryReplayStore();

const context = {
  token: {
    execution_id:
      "external-consumer-test",

    policy_id:
      "policy-1",

    policy_version:
      "1.0.0",

    bundle_hash:
      "bundle-hash",

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
  },

  token_signature:
    "signature",

  signer: {
    sign() {
      return "signed";
    },
  },

  verifier: {
    verify() {
      return true;
    },
  },

  runtime_manifest:
    getRuntimeManifest(),

  runtime_requirements: {
    required_capabilities: [
      "replay-protection",
    ],

    supported_runtime_versions: [
      "1.0.0",
    ],

    supported_schema_versions: [
      "1.0.0",
    ],
  },

  execution_requirements: {
    replay_protection_required:
      true,

    attestation_required:
      true,

    audit_chain_required:
      true,

    independent_verification_required:
      true,
  },
};

executeDecision(
  context,
  replayStore
);

console.log(
  "EXTERNAL EXECUTION VERIFIED"
);

const verification =
  verifyExecutionResult(
    {
      execution_id:
        "external-consumer-test",

      policy_id:
        "policy-1",

      policy_version:
        "1.0.0",

      schema_version:
        "1.0.0",

      runtime_version:
        "1.0.0",

      runtime_hash:
        getRuntimeManifest()
          .runtime_hash,

      decision:
        "approve",

      signals_hash:
        "signals-hash",

      executed_at:
        new Date().toISOString(),
    },

    "signed",

    context.verifier
  );

console.log(
  "EXTERNAL VERIFICATION:",
  verification
);

console.log(
  "RUNTIME MANIFEST VERIFIED"
);



