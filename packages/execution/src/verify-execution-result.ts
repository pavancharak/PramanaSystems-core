import {
  canonicalizeForSigning
} from "./canonical-signing";

import type {
  ExecutionResult,
} from "./execution-result";

import type {
  Verifier,
} from "./verifier-interface";

export function verifyExecutionResult(
  result: ExecutionResult,
  signature: string,
  verifier: Verifier
): boolean {

  return verifier.verify(
    canonicalizeForSigning(result),
    signature
  );
}



