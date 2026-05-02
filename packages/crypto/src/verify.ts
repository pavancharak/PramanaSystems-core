import fs from "fs";

import crypto from "crypto";

import {
  canonicalize,
} from "@pramanasystems/bundle";

import {
  loadPublicKey,
} from "./keys";

export function verifySignature(
  manifestPath: string,
  signature: string
): boolean {

  const manifest =
    JSON.parse(
      fs.readFileSync(
        manifestPath,
        "utf8"
      )
    );

  const canonical =
    canonicalize(
      manifest
    );

  const publicKey =
    loadPublicKey();

  return crypto.verify(
    null,

    Buffer.from(
      canonical,
      "utf8"
    ),

    publicKey,

    Buffer.from(
      signature,
      "base64"
    )
  );
}

export function verifyPayloadSignature(
  payload: string,
  signature: string,
  publicKey: string
): boolean {

  return crypto.verify(
    null,

    Buffer.from(
      payload,
      "utf8"
    ),

    publicKey,

    Buffer.from(
      signature,
      "base64"
    )
  );
}




