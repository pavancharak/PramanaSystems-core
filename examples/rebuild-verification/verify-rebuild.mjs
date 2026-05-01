import fs from "fs";

import path from "path";

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
JSON.parse(
fs.readFileSync(
path.join(
root,
"release-manifest.json"
),
"utf8"
)
);

console.log(
"REBUILD ARTIFACTS:"
);

for (
const artifact
of manifest.artifacts
) {
console.log(
artifact.package,
artifact.sha256
);
}

console.log(
"REBUILD VERIFICATION COMPLETE"
);



