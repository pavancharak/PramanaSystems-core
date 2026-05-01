import {
  executeDecision,
} from "@pramanasystems/core";

const token = {
  execution_id:
    "replay-test-1",

  policy_id:
    "policy-1",

  policy_version:
    "1.0.0",

  decision_type:
    "approve",

  signals_hash:
    "abc123",

  expires_at:
    new Date(
      Date.now() + 60000
    ).toISOString(),
};

const context = {
  token,

  token_signature:
    Buffer.from(
      "signature"
    ),

  signer: {
    sign() {
      return Buffer.from(
        "signed"
      );
    },
  },

  verifier: {
    verify() {
      return true;
    },
  },

  runtime_manifest: {
    runtime_name:
      "PramanaSystems-runtime",

    runtime_version:
      "1.0.0",
  },

  runtime_requirements: {
    runtime_name:
      "PramanaSystems-runtime",

    minimum_version:
      "1.0.0",
  },

  execution_requirements: {
    supported_versions: [
      "1.0.0",
    ],
  },
};

try {

  executeDecision(
    context
  );

  console.log(
    "FIRST EXECUTION: OK"
  );

} catch (error) {

  console.error(
    "FIRST EXECUTION FAILED"
  );

  console.error(
    error.message
  );
}

try {

  executeDecision(
    context
  );

  console.log(
    "REPLAY EXECUTION: OK"
  );

} catch (error) {

  console.log(
    "REPLAY DETECTED:"
  );

  console.log(
    error.message
  );
}


