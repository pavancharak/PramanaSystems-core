import fs from "fs";

import crypto from "crypto";

const {
  publicKey,
  privateKey,
} = crypto.generateKeyPairSync(
  "ed25519"
);

const publicPem =
  publicKey.export({
    type: "spki",
    format: "pem",
  });

const privatePem =
  privateKey.export({
    type: "pkcs8",
    format: "pem",
  });

fs.mkdirSync(
  "trust",
  {
    recursive: true,
  }
);

fs.writeFileSync(
  "trust/PramanaSystems-root.pub",
  publicPem
);

fs.writeFileSync(
  "trust/PramanaSystems-root.key",
  privatePem
);

console.log(
  "Trust root generated"
);



