import fs from "fs";

import {
  describe,
  expect,
  test,
} from "vitest";

import {
  getRuntimeManifest,
  signRuntimeManifest,
  verifyRuntimeManifest,
  LocalSigner,
  LocalVerifier,
} from "@pramanasystems/execution";

const signer =
  new LocalSigner(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key",
      "utf8"
    )
  );

const verifier =
  new LocalVerifier(
    fs.readFileSync(
      "./dev-keys/bundle_signing_key.pub",
      "utf8"
    )
  );

describe(
  "runtime manifest certification",
  () => {

    test(
      "signed runtime manifest verifies",
      () => {

        const manifest =
          getRuntimeManifest();

        const signature =
          signRuntimeManifest(
            manifest,
            signer
          );

        const valid =
          verifyRuntimeManifest(
            manifest,
            signature,
            verifier
          );

        expect(valid)
          .toBe(true);
      }
    );

    test(
      "tampered runtime manifest fails verification",
      () => {

        const manifest =
          getRuntimeManifest();

        const signature =
          signRuntimeManifest(
            manifest,
            signer
          );

        manifest.runtime_version =
          "2.0.0";

        const valid =
          verifyRuntimeManifest(
            manifest,
            signature,
            verifier
          );

        expect(valid)
          .toBe(false);
      }
    );
  }
);



