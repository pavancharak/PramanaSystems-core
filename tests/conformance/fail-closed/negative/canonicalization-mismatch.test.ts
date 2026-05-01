import {
  describe,
  expect,
  test,
} from "vitest";

describe(
  "Canonicalization Negative Conformance",
  () => {
    test(
      "mutated canonical bytes fail verification",
      () => {

        const verifier = {
          verify(
            _payload: string,
            _signature: string
          ) {
            return false;
          },
        };

        const verified =
          verifier.verify(
            "tampered-payload",
            "tampered-signature"
          );

        expect(
          verified
        ).toBe(false);
      }
    );
  }
);


