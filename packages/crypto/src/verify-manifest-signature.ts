import crypto from "crypto";

import {
  loadPublicKey,
} from "./keys";

export function verifyManifestSignature(
  manifest: string,
  signature: string
): boolean {

  const publicKey =
    loadPublicKey();

  return crypto.verify(
    null,

    Buffer.from(
      manifest
    ),

    publicKey,

    Buffer.from(
      signature,
      "base64"
    )
  );
}




