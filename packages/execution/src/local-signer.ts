import crypto from "crypto";

import type {
  Signer,
} from "./signer-interface";

export class LocalSigner
  implements Signer {

  constructor(
    private readonly privateKey: string
  ) {}

  sign(
    payload: string
  ): string {

    return crypto
      .sign(
        null,

        Buffer.from(
          payload,
          "utf8"
        ),

        this.privateKey
      )

      .toString(
        "base64"
      );
  }
}




