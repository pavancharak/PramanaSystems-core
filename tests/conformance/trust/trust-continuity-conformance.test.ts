import {
  describe,
  expect,
  test,
} from "vitest";

import fs from "fs";
import path from "path";

describe(
  "Trust Continuity Conformance",
  () => {

    test(
      "trust rotation preserves governance continuity",
      () => {

        const trustRoot =
          JSON.parse(
            fs.readFileSync(
              path.resolve(
                "trust/trust-root.json"
              ),
              "utf8"
            )
          );

        const rotation =
          JSON.parse(
            fs.readFileSync(
              path.resolve(
                "trust/trust-rotation.json"
              ),
              "utf8"
            )
          );

        expect(
          trustRoot.key_id
        ).toBe(
          rotation.previous_key_id
        );

        expect(
          rotation.next_key_id
        ).toBeTruthy();

        expect(
          rotation.rotated_at
        ).toBeTruthy();
      }
    );
  }
);


