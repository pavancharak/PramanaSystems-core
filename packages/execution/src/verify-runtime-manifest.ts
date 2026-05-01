import {
  canonicalizeForSigning
} from "./canonical-signing";

import type {
  RuntimeManifest,
} from "./runtime-manifest";

import type {
  Verifier,
} from "./verifier-interface";

export function verifyRuntimeManifest(
  manifest: RuntimeManifest,
  signature: string,
  verifier: Verifier
): boolean {

  return verifier.verify(
    canonicalizeForSigning(manifest),
    signature
  );
}



