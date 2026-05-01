import fs from "fs";

import {
  createPrivateKey,
  sign,
} from "crypto";

const privateKeyPem =
  fs.readFileSync(
    "./trust/PramanaSystems-root.key",
    "utf8"
  );

const privateKey =
  createPrivateKey(
    privateKeyPem
  );

const result = {
  execution_id:
    "portable-attestation-1",

  policy_id:
    "policy-1",

  policy_version:
    "1.0.0",

  schema_version:
    "1.0.0",

  runtime_version:
    "1.0.0",

  runtime_hash:
    "runtime-hash",

  decision:
    "approve",

  signals_hash:
    "signals-hash",

  executed_at:
    new Date().toISOString(),
};

const payload =
  JSON.stringify(
    result
  );

const signature =
  sign(
    null,
    Buffer.from(payload),
    privateKey
  ).toString(
    "base64"
  );

const attestation = {
  result,
  signature,
};

fs.writeFileSync(
  "./execution.attestation.json",
  JSON.stringify(
    attestation,
    null,
    2
  )
);

console.log(
  "ATTESTATION GENERATED"
);


