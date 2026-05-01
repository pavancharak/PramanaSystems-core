import fs from "fs";

import path from "path";

import crypto from "crypto";

import child_process from "child_process";

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

const packages = [
  "bundle",
  "crypto",
  "governance",
  "execution",
  "verifier",
  "core",
];

const artifacts =
  packages.map(
    (pkg) => {

      const packageDir =
        path.join(
          "packages",
          pkg
        );

      const tarball =
        fs.readdirSync(
          packageDir
        ).find(
          (file) =>
            file.endsWith(
              ".tgz"
            )
        );

      if (!tarball) {
        throw new Error(
          `Missing tarball for ${pkg}`
        );
      }

      const tarballPath =
        path.join(
          packageDir,
          tarball
        );

      return {
        package: pkg,

        artifact:
          tarball,

        sha256:
          sha256(
            tarballPath
          ),
      };
    }
  );

const gitCommit =
  child_process
    .execSync(
      "git rev-parse HEAD"
    )
    .toString()
    .trim();

const gitTag =
  process.env.GITHUB_REF_NAME ??
  "development";

const generatedBy =
  "PramanaSystems-release-pipeline";

const manifest = {
  manifest_version:
    "1.0.0",

  generated_at:
    new Date()
      .toISOString(),

  git_commit:
    gitCommit,

  git_tag:
    gitTag,

  generated_by:
    generatedBy,

  node_version:
    process.version,

  artifacts,
};

fs.writeFileSync(
  "release-manifest.json",

  JSON.stringify(
    manifest,
    null,
    2
  )
);

console.log(
  "Release manifest generated"
);


