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

const trustRoot =
  JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        "trust",
        "trust-root.json"
      ),
      "utf8"
    )
  );

const rotation =
  JSON.parse(
    fs.readFileSync(
      path.join(
        root,
        "trust",
        "trust-rotation.json"
      ),
      "utf8"
    )
  );

console.log(
  "CURRENT TRUST ROOT:"
);

console.log(
  trustRoot.key_id
);

console.log(
  "ROTATION TARGET:"
);

console.log(
  rotation.next_key_id
);

if (
  rotation.previous_key_id ===
  trustRoot.key_id
) {

  console.log(
    "TRUST ROTATION VERIFIED"
  );

} else {

  console.log(
    "TRUST ROTATION INVALID"
  );
}


