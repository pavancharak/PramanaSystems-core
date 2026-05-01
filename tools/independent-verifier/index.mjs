#!/usr/bin/env node

const command =
  process.argv[2];

switch (command) {

  case "verify-release":
    await import(
      "./verify-release.mjs"
    );
    break;

  case "verify-attestation":
    await import(
      "./verify-attestation.mjs"
    );
    break;

  case "verify-runtime":
    await import(
      "./verify-runtime-manifest.mjs"
    );
    break;

  default:
    console.log(`
PramanaSystems Independent Verifier

Commands:

  verify-release
  verify-attestation
  verify-runtime
`);
}


