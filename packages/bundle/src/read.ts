import fs from "fs";
import path from "path";

import type {
  BundleManifest,
} from "./types";

export function readManifest(
  directory: string
): BundleManifest {
  const manifestPath = path.join(
    directory,
    "bundle.manifest.json"
  );

  const content =
    fs.readFileSync(
      manifestPath,
      "utf8"
    );

  return JSON.parse(content);
}




