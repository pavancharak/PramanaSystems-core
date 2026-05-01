import fs from "fs";

import crypto from "crypto";

const rotation =
  fs.readFileSync(
    "trust/trust-rotation.json",
    "utf8"
  );

const privateKey =
  fs.readFileSync(
    "trust/PramanaSystems-root.key",
    "utf8"
  );

const signature =
  crypto.sign(
    null,

    Buffer.from(
      rotation,
      "utf8"
    ),

    privateKey
  );

fs.writeFileSync(
  "trust/trust-rotation.sig",

  signature.toString(
    "base64"
  )
);

console.log(
  "Trust rotation signed"
);



