#!/usr/bin/env node

import fs from "node:fs";

import {
  LocalVerifier
} from "@pramanasystems/core";

async function main() {

  console.log("");
  console.log("PramanaSystems Verifier CLI");
  console.log("");

  const publicKey =
    fs.readFileSync(
      "./dev-keys/bundle_signing_key.pub",
      "utf8"
    );

  const verifier =
    new LocalVerifier(publicKey);

  const command = process.argv[2];

  switch (command) {

    case "verify-attestation": {
      const file = process.argv[3];

      if (!file) {
        console.log(
          "Usage: pramanasystems-verifier verify-attestation <file>"
        );

        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.log("Attestation file not found.");
        process.exit(1);
      }

      try {
        const content =
          fs.readFileSync(file, "utf8");

        const parsed =
          JSON.parse(content);

        console.log("");
        console.log("ATTESTATION:");
        console.log(parsed);

        if (
          !parsed.decision ||
          !parsed.policyVersion ||
          !parsed.signature
        ) {
          throw new Error(
            "Invalid attestation structure."
          );
        }

        if (
          typeof parsed.signature !== "string"
        ) {
          throw new Error(
            "Invalid attestation signature."
          );
        }

        const payload = {
          decision: parsed.decision,
          policyVersion: parsed.policyVersion,
          timestamp: parsed.timestamp
        };

        const verified =
          await verifier.verify(
            JSON.stringify(payload),
            parsed.signature
          );

        if (!verified) {
          throw new Error(
            "Cryptographic signature verification failed."
          );
        }

        console.log("");
        console.log(
          "Cryptographic attestation verification succeeded."
        );

      } catch (err) {

        console.log("");
        console.log(
          "Attestation verification failed."
        );

        console.log(
          err instanceof Error
            ? err.message
            : String(err)
        );

        process.exit(1);
      }

      break;
    }

    default:
      console.log("Unknown command.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});