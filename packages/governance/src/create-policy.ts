import fs from "fs";
import path from "path";

export function createPolicy(
  policyId: string
): string {
  const policyRoot = path.join(
    "./policies",
    policyId
  );

  const versionDirectory =
    path.join(
      policyRoot,
      "v1"
    );

  if (fs.existsSync(policyRoot)) {
    throw new Error(
      `Policy already exists: ${policyId}`
    );
  }

  fs.mkdirSync(
    versionDirectory,
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    path.join(
      versionDirectory,
      "policy.json"
    ),

    JSON.stringify(
      {
        policy: policyId,
        version: "v1",
      },
      null,
      2
    ),

    "utf8"
  );

  return versionDirectory;
}




