import {
  createPolicy,
} from "../packages/governance/src/create-policy";

import {
  upgradePolicy,
} from "../packages/governance/src/upgrade-policy";

const created =
  createPolicy(
    "claims-approval"
  );

console.log({
  created,
});

const upgraded =
  upgradePolicy(
    "claims-approval"
  );

console.log({
  upgraded,
});


