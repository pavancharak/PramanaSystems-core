import fs from "fs";
import path from "path";

import { generateManifest }
  from "../packages/bundle/src/manifest";

import { writeManifest }
  from "../packages/bundle/src/write";

import { verifyManifest }
  from "../packages/bundle/src/verify";

import { signManifest }
  from "../packages/crypto/src/sign";

import {
  writeSignature,
  readSignature,
} from "../packages/crypto/src/persist";

import { verifySignature }
  from "../packages/crypto/src/verify";

const directory =
  path.resolve(
    "./tests/bundle-example"
  );

const manifestPath =
  path.join(
    directory,
    "bundle.manifest.json"
  );

const policyFile =
  path.join(
    directory,
    "policy.json"
  );

const originalContent =
  fs.readFileSync(
    policyFile,
    "utf8"
  );

const manifest =
  generateManifest(
    "claims-approval",
    "v1",
    directory
  );

writeManifest(
  manifest,
  directory
);

const signature =
  signManifest(
    manifestPath
  );

writeSignature(
  signature,
  directory
);

fs.writeFileSync(
  policyFile,

  JSON.stringify(
    {
      policy:
        "claims-approval",

      version:
        "v2"
    },
    null,
    2
  ),

  "utf8"
);

const tamperedManifest =
  generateManifest(
    "claims-approval",
    "v1",
    directory
  );

const manifestValid =
  verifyManifest(
    tamperedManifest,
    directory
  );

const loadedSignature =
  readSignature(
    directory
  );

const signatureValid =
  verifySignature(
    manifestPath,
    loadedSignature
  );

console.log({
  tampered: true,

  manifestValid:
    manifestValid.valid,

  signatureValid,
});

fs.writeFileSync(
  policyFile,
  originalContent,
  "utf8"
);


