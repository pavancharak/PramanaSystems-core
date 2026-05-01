import fs from "fs";

import path from "path";

import {
  fileURLToPath,
} from "url";

import {
  createPublicKey,
  verify,
} from "crypto";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const manifest =
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../../release-manifest.json"
    )
  );

const signature =
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../../release-manifest.sig"
    ),
    "utf8"
  );

const publicKeyPem =
  fs.readFileSync(
    path.resolve(
      __dirname,
      "../../trust/PramanaSystems-root.pub"
    ),
    "utf8"
  );

const publicKey =
  createPublicKey(
    publicKeyPem
  );

const verified =
  verify(
    null,
    manifest,
    publicKey,
    Buffer.from(
      signature,
      "base64"
    )
  );

console.log(
  "RELEASE VERIFIED:",
  verified
);


