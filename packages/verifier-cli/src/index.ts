#!/usr/bin/env node

import fs from "node:fs";

console.log("");
console.log("PramanaSystems Verifier CLI");
console.log("");

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
        !parsed.policyVersion
      ) {
        throw new Error(
          "Invalid attestation structure."
        );
      }

      console.log("");
      console.log(
        "Attestation verification succeeded."
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

  case "verify-runtime": {
    const file = process.argv[3];

    if (!file) {
      console.log(
        "Usage: pramanasystems-verifier verify-runtime <file>"
      );

      process.exit(1);
    }

    if (!fs.existsSync(file)) {
      console.log("Runtime manifest file not found.");
      process.exit(1);
    }

    try {
      const content =
        fs.readFileSync(file, "utf8");

      const parsed =
        JSON.parse(content);

      console.log("");
      console.log("RUNTIME MANIFEST:");
      console.log(parsed);

      if (
        !parsed.runtime ||
        !parsed.version
      ) {
        throw new Error(
          "Invalid runtime manifest."
        );
      }

      console.log("");
      console.log(
        "Runtime verification succeeded."
      );

    } catch (err) {

      console.log("");
      console.log(
        "Runtime verification failed."
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

  case "verify-release": {
    const file = process.argv[3];

    if (!file) {
      console.log(
        "Usage: pramanasystems-verifier verify-release <file>"
      );

      process.exit(1);
    }

    if (!fs.existsSync(file)) {
      console.log("Release manifest file not found.");
      process.exit(1);
    }

    try {
      const content =
        fs.readFileSync(file, "utf8");

      const parsed =
        JSON.parse(content);

      console.log("");
      console.log("RELEASE MANIFEST:");
      console.log(parsed);

      if (
        !parsed.version ||
        !parsed.artifacts
      ) {
        throw new Error(
          "Invalid release manifest."
        );
      }

      console.log("");
      console.log(
        "Release verification succeeded."
      );

    } catch (err) {

      console.log("");
      console.log(
        "Release verification failed."
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

  case "verify-compatibility": {
  const file = process.argv[3];

  if (!file) {
    console.log(
      "Usage: pramanasystems-verifier verify-compatibility <file>"
    );

    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.log("Compatibility manifest file not found.");
    process.exit(1);
  }

  try {
    const content =
      fs.readFileSync(file, "utf8");

    const parsed =
      JSON.parse(content);

    console.log("");
    console.log("COMPATIBILITY MANIFEST:");
    console.log(parsed);

    if (
      !parsed.runtimeVersion ||
      !parsed.policyVersion ||
      !parsed.compatibility
    ) {
      throw new Error(
        "Invalid compatibility manifest."
      );
    }

    console.log("");
    console.log(
      "Compatibility verification succeeded."
    );

  } catch (err) {

    console.log("");
    console.log(
      "Compatibility verification failed."
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