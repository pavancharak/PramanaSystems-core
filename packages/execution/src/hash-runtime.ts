import crypto from "crypto";

import fs from "fs";

export function hashRuntime(): string {
  const manifest =
    fs.readFileSync(
      "./runtime/runtime.manifest.json",
      "utf8"
    );

  return crypto
    .createHash(
      "sha256"
    )
    .update(
      manifest
    )
    .digest(
      "hex"
    );
}




