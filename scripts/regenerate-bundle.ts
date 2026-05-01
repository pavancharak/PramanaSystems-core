import path from "path";

import {
  generateManifest
} from "../packages/bundle/src/manifest";

import {
  writeManifest
} from "../packages/bundle/src/write";

const bundlePath =
  process.argv[2];

if (!bundlePath) {
  throw new Error(
    "Bundle path required"
  );
}

const normalizedPath =
  path.normalize(bundlePath);

const policyVersion =
  path.basename(
    normalizedPath
  );

const policyId =
  path.basename(
    path.dirname(
      normalizedPath
    )
  );

const manifest =
  generateManifest(
    policyId,
    policyVersion,
    normalizedPath
  );

writeManifest(
  manifest,
  normalizedPath
);

console.log(
  `Updated bundle hash for ${bundlePath}`
);


