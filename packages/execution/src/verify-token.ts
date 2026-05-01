import {
  canonicalizeForSigning
} from "./canonical-signing";

import type {
  ExecutionToken,
} from "./execution-token";

import type {
  Verifier,
} from "./verifier-interface";

export function verifyExecutionToken(
  token: ExecutionToken,
  signature: string,
  verifier: Verifier
): boolean {

  return verifier.verify(
    canonicalizeForSigning(token),
    signature
  );
}



