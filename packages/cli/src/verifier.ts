import fs from "fs";

import {
  verifyExecutionResult,

  LocalVerifier,
} from "@pramanasystems/execution";

interface ExecutionAttestation {
  result: unknown;

  signature: string;
}

const verifier =
  new LocalVerifier(
    fs.readFileSync(
      "./test-keys/PramanaSystems_test_key.pub",
      "utf8"
    )
  );

export function verifyAttestationFile(
  filePath: string
): void {

  const raw =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  const attestation =
    JSON.parse(
      raw
    ) as ExecutionAttestation;

  const valid =
    verifyExecutionResult(
      attestation.result as never,

      attestation.signature,

      verifier
    );

  if (!valid) {
    console.error(
      "INVALID ATTESTATION"
    );

    process.exit(1);
  }

  console.log(
    "VALID ATTESTATION"
  );
}



