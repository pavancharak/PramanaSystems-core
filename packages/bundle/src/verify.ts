import fs from "fs";
import path from "path";

import { canonicalize } from "./canonicalize";
import { sha256 } from "./hash";
import { traverseDirectory } from "./traverse";

import type {
  BundleManifest,
  VerifyResult,
} from "./types";

export function verifyManifest(
  manifest: BundleManifest,
  directory: string
): VerifyResult {

  const files =
    traverseDirectory(directory);

  const recalculatedArtifacts =
    files.map((relativePath) => {

      const fullPath =
        path.join(
          directory,
          relativePath
        );

      const content =
        fs.readFileSync(
          fullPath,
          "utf8"
        );

      const canonicalContent =
        relativePath.endsWith(".json")
          ? canonicalize(
              JSON.parse(content)
            )
          : content.replace(
              /\r\n/g,
              "\n"
            );

      return {
        path: relativePath,

        hash:
          sha256(
            canonicalContent
          ),
      };
    });

  const reconstructedManifest: BundleManifest =
    {
      manifest_version:
        manifest.manifest_version,

      policy_id:
        manifest.policy_id,

      policy_version:
        manifest.policy_version,

      artifacts:
        recalculatedArtifacts,

      runtime_requirements:
        manifest.runtime_requirements,

      bundle_hash: "",
    };

  const canonical =
    canonicalize(
      reconstructedManifest
    );

  const recalculatedBundleHash =
    sha256(
      canonical
    );

  return {
    valid:
      recalculatedBundleHash ===
      manifest.bundle_hash,

    expected_bundle_hash:
      manifest.bundle_hash,

    actual_bundle_hash:
      recalculatedBundleHash,
  };
}




