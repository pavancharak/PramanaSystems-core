import fs from "fs";

import crypto from "crypto";

const manifest =
  fs.readFileSync(
    "runtime/certified-runtime-manifest.json"
  );

const privateKey =
  fs.readFileSync(
    "trust/PramanaSystems-root.key",
    "utf8"
  );

const signature =
  crypto.sign(
    null,
    manifest,
    privateKey
  );

fs.writeFileSync(
  "runtime/certified-runtime-manifest.sig",

  signature.toString(
    "base64"
  )
);

console.log(
  "Runtime manifest signed"
);


