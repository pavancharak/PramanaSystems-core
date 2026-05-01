import fs from "fs";

import {
  createPublicKey,
  verify,
} from "crypto";

const attestation =
  JSON.parse(
    fs.readFileSync(
      "./execution.attestation.json",
      "utf8"
    )
  );

const publicKeyPem =
  fs.readFileSync(
    "./trust/PramanaSystems-root.pub",
    "utf8"
  );

const publicKey =
  createPublicKey(
    publicKeyPem
  );

const payload =
  JSON.stringify(
    attestation.result
  );

const signature =
  Buffer.from(
    attestation.signature,
    "base64"
  );

const verified =
  verify(
    null,
    Buffer.from(payload),
    publicKey,
    signature
  );

console.log(
  "ATTESTATION VERIFIED:",
  verified
);


