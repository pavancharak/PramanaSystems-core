import path from "path";

import { generateManifest }
  from "../packages/bundle/src/manifest";

import { writeManifest }
  from "../packages/bundle/src/write";

import { signManifest }
  from "../packages/crypto/src/sign";

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

const valid =
  verifySignature(
    manifestPath,
    signature
  );

console.log({
  signature,
  valid,
});



