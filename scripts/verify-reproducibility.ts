import fs from "fs";

import crypto from "crypto";

function sha256(
  filePath: string
): string {

  const content =
    fs.readFileSync(
      filePath
    );

  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
}

const manifest =
  JSON.parse(
    fs.readFileSync(
      "release-manifest.json",
      "utf8"
    )
  );

for (
  const artifact
  of manifest.artifacts
) {
  const currentHash =
    sha256(
      artifact.artifact
    );

  if (
    currentHash !==
    artifact.sha256
  ) {
    throw new Error(
      `Reproducibility verification failed for ${artifact.artifact}`
    );
  }

  console.log(
    `Verified ${artifact.artifact}`
  );
}

console.log(
  "Release reproducibility verification passed"
);


