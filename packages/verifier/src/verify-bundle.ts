import fs from "fs";

import {
  verifyManifestSignature,
} from "@pramanasystems/crypto";

export interface BundleVerificationResult {
  valid: boolean;

  manifest_verified: boolean;
}

export function verifyBundle(
  manifestPath: string,
  signaturePath: string
): BundleVerificationResult {

  const manifest =
    fs.readFileSync(
      manifestPath,
      "utf8"
    );

  const signature =
    fs.readFileSync(
      signaturePath,
      "utf8"
    );

  const verified =
    verifyManifestSignature(
      manifest,
      signature
    );

  return {
    valid:
      verified,

    manifest_verified:
      verified,
  };
}



