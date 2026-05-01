import path from "path";

import {
  generateBundle,
} from "../packages/governance/src/generate-bundle";

const directory = path.resolve(
  "./tests/bundle-example"
);

const result =
  generateBundle(
    "claims-approval",
    "v1",
    directory
  );

console.log(result);



