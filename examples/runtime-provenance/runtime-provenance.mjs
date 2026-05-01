import {
  LocalSigner,
  LocalVerifier,
  getRuntimeManifest,
  signRuntimeManifest,
  verifyRuntimeManifest
} from "@pramanasystems/core";

const signer = new LocalSigner();
const verifier = new LocalVerifier();

const manifest = getRuntimeManifest();

console.log("RUNTIME MANIFEST:");
console.log(manifest);

const signedManifest = await signRuntimeManifest(
  manifest,
  signer
);

console.log("");
console.log("SIGNED MANIFEST:");
console.log(signedManifest);

const verified = await verifyRuntimeManifest(
  signedManifest,
  verifier
);

console.log("");
console.log("VERIFICATION RESULT:");
console.log(verified);
