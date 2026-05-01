import fs from "fs";
import path from "path";

import { canonicalize } from "./canonicalize";

import type {
  BundleManifest,
} from "./types";

export function writeManifest(
  manifest: BundleManifest,
  directory: string
): void {
  const manifestPath = path.join(
    directory,
    "bundle.manifest.json"
  );

  const canonical =
    canonicalize(manifest);

  fs.writeFileSync(
    manifestPath,
    canonical,
    "utf8"
  );
}




