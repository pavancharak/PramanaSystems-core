import path from "path";

import {
  generateBundle,
} from "../packages/governance/src/generate-bundle";

import {
  validatePolicy,
} from "../packages/governance/src/validate-policy";

const v1Directory = path.resolve(
  "./policies/claims-approval/v1"
);

const v2Directory = path.resolve(
  "./policies/claims-approval/v2"
);

console.log("Generating v1 bundle");

generateBundle(
  "claims-approval",
  "v1",
  v1Directory
);

console.log("Generating v2 bundle");

generateBundle(
  "claims-approval",
  "v2",
  v2Directory
);

console.log("Running validation");

const valid =
  validatePolicy(
    "claims-approval"
  );

console.log({
  valid,
});


