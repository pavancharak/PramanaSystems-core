import {
  canonicalizeForSigning
} from "./canonical-signing";

import type {
  ExecutionToken,
} from "./execution-token";

import type {
  Signer,
} from "./signer-interface";

export function signExecutionToken(
  token: ExecutionToken,
  signer: Signer
): string {

  return signer.sign(
    canonicalizeForSigning(token)
  );
}




