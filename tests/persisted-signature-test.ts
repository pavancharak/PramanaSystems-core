import path from "path";

import { generateManifest }
  from "../packages/bundle/src/manifest";

import { writeManifest }
  from "../packages/bundle/src/write";

import { readManifest }
  from "../packages/bundle/src/read";

import { signManifest }
  from "../packages/crypto/src/sign";

import { verifySignature }
  from "../packages/crypto/src/verify";

import {
  writeSignature,
  readSignature,
} from "../packages/crypto/src/persist";

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

writeSignature(
  signature,
  directory
);

readManifest(
  directory
);

const loadedSignature =
  readSignature(
    directory
  );

const valid =
  verifySignature(
    manifestPath,
    loadedSignature
  );

console.log({
  valid,
  loadedSignature,
});



