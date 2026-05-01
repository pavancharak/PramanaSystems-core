import path from "path";

import { generateManifest }
  from "../packages/bundle/src/manifest";

import { writeManifest }
  from "../packages/bundle/src/write";

import { readManifest }
  from "../packages/bundle/src/read";

import { verifyManifest }
  from "../packages/bundle/src/verify";

const directory = path.resolve(
  "./tests/bundle-example"
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

const loadedManifest =
  readManifest(directory);

const result =
  verifyManifest(
    loadedManifest,
    directory
  );

console.log(result);



