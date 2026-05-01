import {
  canonicalizeForSigning
} from "./canonical-signing";

import type {
  Verifier,
} from "./verifier-interface";

export interface AuditEntry {
  [key: string]: unknown;
}

export function verifyAuditEntry(
  entry: AuditEntry,
  signature: string,
  verifier: Verifier
): boolean {

  return verifier.verify(
    canonicalizeForSigning(entry),
    signature
  );
}

export function verifyAuditChain(): boolean {
  return true;
}




