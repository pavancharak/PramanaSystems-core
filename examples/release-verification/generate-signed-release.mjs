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

const release = {
  version: "1.0.3",
  artifacts: [
    "@pramanasystems/core",
    "@pramanasystems/execution",
    "@pramanasystems/verifier"
  ]
};

const payload =
  JSON.stringify(release);

const signature =
  await signer.sign(payload);

const signed = {
  ...release,
  signature
};

console.log("");
console.log("SIGNED RELEASE:");
console.log("");

console.log(
  JSON.stringify(signed, null, 2)
);