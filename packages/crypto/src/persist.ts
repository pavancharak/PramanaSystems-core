import fs from "fs";
import path from "path";

export function writeSignature(
  signature: string,
  directory: string
): void {
  const signaturePath = path.join(
    directory,
    "bundle.sig"
  );

  fs.writeFileSync(
    signaturePath,
    signature,
    "utf8"
  );
}

export function readSignature(
  directory: string
): string {
  const signaturePath = path.join(
    directory,
    "bundle.sig"
  );

  return fs.readFileSync(
    signaturePath,
    "utf8"
  );
}




