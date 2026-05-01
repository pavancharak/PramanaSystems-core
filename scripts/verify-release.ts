import fs from "fs";

import crypto from "crypto";

import {
  verifySignature,
} from "@pramanasystems/crypto";

const manifestPath =
  "release-manifest.json";

const signaturePath =
  "release-manifest.sig";

if (
  !fs.existsSync(
    manifestPath
  )
) {
  throw new Error(
    "Missing release manifest"
  );
}

if (
  !fs.existsSync(
    signaturePath
  )
) {
  throw new Error(
    "Missing release signature"
  );
}

const signature =
  fs.readFileSync(
    signaturePath,
    "utf8"
  );

const valid =
  verifySignature(
    manifestPath,
    signature
  );

if (!valid) {
  throw new Error(
    "Release signature verification failed"
  );
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      manifestPath,
      "utf8"
    )
  );

for (
  const artifact
  of manifest.artifacts
) {
  const content =
    fs.readFileSync(
      artifact.artifact
    );

  const hash =
    crypto
      .createHash(
        "sha256"
      )
      .update(content)
      .digest("hex");

  if (
    hash !==
    artifact.sha256
  ) {
    throw new Error(
      `Hash mismatch for ${artifact.artifact}`
    );
  }
}

console.log(
  "Release verification passed"
);



