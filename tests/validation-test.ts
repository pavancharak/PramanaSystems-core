import path from "path";

import {
  generateBundle,
} from "../packages/governance/src/generate-bundle";

import {
  validatePolicy,
} from "../packages/governance/src/validate-policy";

import {
  LocalValidator
} from "@pramanasystems/core";

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

console.log("Running policy validation");

const valid =
  validatePolicy(
    "claims-approval"
  );

console.log({
  valid,
});

console.log(
  "Running deterministic validation"
);

const validator =
  new LocalValidator();

const envelopeA = {
  payload: {
    version: "1.0.0",
    artifacts: [
      "claims-approval.bundle.json"
    ]
  },

  metadata: {
    operational: {
      generatedAt:
        new Date().toISOString(),

      environment: "windows"
    }
  },

  signature: "test"
};

const envelopeB = {
  payload: {
    version: "1.0.0",
    artifacts: [
      "claims-approval.bundle.json"
    ]
  },

  metadata: {
    operational: {
      generatedAt:
        new Date().toISOString(),

      environment: "linux"
    }
  },

  signature: "test"
};

const resultA =
  validator.validate(envelopeA);

const resultB =
  validator.validate(envelopeB);

console.log({
  resultA,
  resultB
});

if (!resultA.stages.structure) {
  throw new Error(
    "Envelope A structure validation failed."
  );
}

if (!resultB.stages.structure) {
  throw new Error(
    "Envelope B structure validation failed."
  );
}

if (!resultA.stages.canonical) {
  throw new Error(
    "Envelope A canonical validation failed."
  );
}

if (!resultB.stages.canonical) {
  throw new Error(
    "Envelope B canonical validation failed."
  );
}

if (
  !resultA.stages.metadataIsolation
) {
  throw new Error(
    "Envelope A metadata isolation failed."
  );
}

if (
  !resultB.stages.metadataIsolation
) {
  throw new Error(
    "Envelope B metadata isolation failed."
  );
}

console.log(
  "Deterministic validation succeeded."
);
console.log(
  "Running contamination validation"
);

const contaminatedEnvelope = {
  payload: {
    version: "1.0.0",

    generatedAt:
      new Date().toISOString(),

    artifacts: [
      "claims-approval.bundle.json"
    ]
  },

  signature: "test"
};

const contaminatedResult =
  validator.validate(
    contaminatedEnvelope
  );

console.log({
  contaminatedResult
});

if (
  contaminatedResult.stages
    .deterministic
) {
  throw new Error(
    "Operational contamination was not detected."
  );
}

console.log(
  "Operational contamination correctly rejected."
);