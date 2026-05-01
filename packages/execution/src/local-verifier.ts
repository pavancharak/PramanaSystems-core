import crypto from "crypto";

import type {
  Verifier,
} from "./verifier-interface";

export class LocalVerifier
  implements Verifier {

  constructor(
    private readonly publicKey: string
  ) {}

  verify(
    payload: string,
    signature: string
  ): boolean {

    return crypto.verify(
      null,

      Buffer.from(
        payload,
        "utf8"
      ),

      this.publicKey,

      Buffer.from(
        signature,
        "base64"
      )
    );
  }
}



