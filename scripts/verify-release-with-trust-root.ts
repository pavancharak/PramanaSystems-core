import fs from "fs";

import crypto from "crypto";

const manifest =
  fs.readFileSync(
    "release-manifest.json",
    "utf8"
  );

const signature =
  fs.readFileSync(
    "release-manifest.sig",
    "utf8"
  );

const publicKey =
  fs.readFileSync(
    "trust/PramanaSystems-root.pub",
    "utf8"
  );

const verified =
  crypto.verify(
    null,

    Buffer.from(
      manifest,
      "utf8"
    ),

    publicKey,

    Buffer.from(
      signature,
      "base64"
    )
  );

if (!verified) {
  throw new Error(
    "Trust-root verification failed"
  );
}

console.log(
  "Trust-root verification passed"
);



