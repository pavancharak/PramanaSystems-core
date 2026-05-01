import fs from "fs";

import crypto from "crypto";

import {
  canonicalize,
} from "@pramanasystems/bundle";

import {
  loadPrivateKey,
} from "./keys";

export function signManifest(
  manifestPath: string
): string {

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

  const privateKey =
    loadPrivateKey();

  const signature =
    crypto.sign(
      null,

      Buffer.from(
        canonical,
        "utf8"
      ),

      privateKey
    );

  return signature.toString(
    "base64"
  );
}



