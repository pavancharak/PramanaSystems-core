import fs from "node:fs";

import {
  LocalSigner
} from "@pramanasystems/core";

const privateKey =
  fs.readFileSync(
    "./dev-keys/bundle_signing_key",
    "utf8"
  );

const signer =
  new LocalSigner(privateKey);

const attestation = {
  decision: "ALLOW",
  policyVersion: "1.0.3",
  timestamp: 1746070000
};

const payload =
  JSON.stringify(attestation);

const signature =
  await signer.sign(payload);

const signed = {
  ...attestation,
  signature
};

console.log("");
console.log("SIGNED ATTESTATION:");
console.log("");

console.log(
  JSON.stringify(signed, null, 2)
);
