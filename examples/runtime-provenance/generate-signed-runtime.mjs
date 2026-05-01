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

const runtime = {
  runtime: "pramanasystems-runtime",
  version: "1.0.3",
  compatibility: "stable"
};

const payload =
  JSON.stringify(runtime);

const signature =
  await signer.sign(payload);

const signed = {
  ...runtime,
  signature
};

console.log("");
console.log("SIGNED RUNTIME:");
console.log("");

console.log(
  JSON.stringify(signed, null, 2)
);