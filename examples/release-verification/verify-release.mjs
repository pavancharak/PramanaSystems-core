import fs from "fs";

import path from "path";

import crypto from "crypto";

import {
fileURLToPath,
} from "url";

const __filename =
fileURLToPath(
import.meta.url
);

const __dirname =
path.dirname(
__filename
);

const root =
path.resolve(
__dirname,
"../.."
);

const manifest =
fs.readFileSync(
path.join(
root,
"release-manifest.json"
)
);

const signature =
Buffer.from(
fs.readFileSync(
path.join(
root,
"release-manifest.sig"
),
"utf8"
),
"base64"
);

const publicKey =
fs.readFileSync(
path.join(
root,
"trust",
"PramanaSystems-root.pub"
),
"utf8"
);

const valid =
crypto.verify(
null,
manifest,
publicKey,
signature
);

console.log(
"RELEASE VERIFIED:",
valid
);



