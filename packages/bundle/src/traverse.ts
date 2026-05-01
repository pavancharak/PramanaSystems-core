import fs from "fs";
import path from "path";

const EXCLUDED_FILES = [
  "bundle.manifest.json",
  "bundle.sig",
];

export function traverseDirectory(
  directory: string,
  root: string = directory
): string[] {
  const entries = fs
    .readdirSync(directory, {
      withFileTypes: true,
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      results.push(
        ...traverseDirectory(
          fullPath,
          root
        )
      );

      continue;
    }

    if (
      EXCLUDED_FILES.includes(
        entry.name
      )
    ) {
      continue;
    }

    const relativePath =
      path.relative(
        root,
        fullPath
      );

    results.push(
      normalizePath(relativePath)
    );
  }

  return results;
}

function normalizePath(
  value: string
): string {
  return value.replace(/\\\\/g, "/");
}



