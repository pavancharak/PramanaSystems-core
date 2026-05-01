import fs from "fs";

import path from "path";

const PRIVATE_KEY_PATH =
  path.resolve(
    "./keys/bundle_signing_key"
  );

const PUBLIC_KEY_PATH =
  path.resolve(
    "./keys/bundle_signing_key.pub"
  );

export function loadPrivateKey(): string {

  return fs.readFileSync(
    PRIVATE_KEY_PATH,
    "utf8"
  );
}

export function loadPublicKey(): string {

  return fs.readFileSync(
    PUBLIC_KEY_PATH,
    "utf8"
  );
}



