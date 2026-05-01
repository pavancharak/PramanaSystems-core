import fs from "fs";

import path from "path";

import {
  signManifest,
} from "../packages/crypto/src/sign";

const bundlePath =
  process.argv[2];

if (!bundlePath) {
  throw new Error(
    "Bundle path required"
  );
}

const manifestPath =
  path.join(
    bundlePath,
    "bundle.manifest.json"
  );

const signaturePath =
  path.join(
    bundlePath,
    "bundle.sig"
  );

const signature =
  signManifest(
    manifestPath
  );

fs.writeFileSync(
  signaturePath,
  signature
);

console.log(
  `Signed bundle: ${bundlePath}`
);



