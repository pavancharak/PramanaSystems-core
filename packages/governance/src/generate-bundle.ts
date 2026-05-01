import path from "path";

import {
  generateManifest,
  writeManifest,
} from "@pramanasystems/bundle";

import {
  signManifest,
  writeSignature,
} from "@pramanasystems/crypto";

import type {
  BundleGenerationResult,
} from "./types";

export function generateBundle(
  policyId: string,
  policyVersion: string,
  policyDirectory: string
): BundleGenerationResult {

  const directory =
    path.resolve(
      policyDirectory
    );

  const manifest =
    generateManifest(
      policyId,
      policyVersion,
      directory
    );

  writeManifest(
    manifest,
    directory
  );

  const manifestPath =
    path.join(
      directory,
      "bundle.manifest.json"
    );

  const signature =
    signManifest(
      manifestPath
    );

  writeSignature(
    signature,
    directory
  );

  return {
    success: true,

    manifest_path:
      manifestPath,

    signature_path:
      path.join(
        directory,
        "bundle.sig"
      ),

    bundle_hash:
      manifest.bundle_hash,
  };
}



