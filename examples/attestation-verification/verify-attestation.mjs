import {
  LocalSigner,
  LocalVerifier,
  signExecutionResult,
  verifyExecutionResult
} from "@pramanasystems/core";

const signer = new LocalSigner();
const verifier = new LocalVerifier();

const executionResult = {
  decision: "ALLOW",
  policyVersion: "1.0.0",
  timestamp: Date.now()
};

console.log("EXECUTION RESULT:");
console.log(executionResult);

const signed = await signExecutionResult(
  executionResult,
  signer
);

console.log("");
console.log("SIGNED ATTESTATION:");
console.log(signed);

const verified = await verifyExecutionResult(
  signed,
  verifier
);

console.log("");
console.log("VERIFICATION RESULT:");
console.log(verified);
