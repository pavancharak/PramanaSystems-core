import {
  LocalSigner,
  verifyExecutionResult
} from "@pramanasystems/core";

const signer = new LocalSigner();

console.log("SIGNER:");
console.log(signer);

console.log("VERIFY FUNCTION:");
console.log(typeof verifyExecutionResult);
