import {
  KMSClient,
  SignCommand,
} from "@aws-sdk/client-kms";

import type {
  AsyncSigner,
} from "./async-signer-interface";

export class AwsKmsSigner
  implements AsyncSigner {

  private readonly client:
    KMSClient;

  constructor(
    private readonly keyId: string,
    region = "us-east-1"
  ) {

    this.client =
      new KMSClient({
        region,
      });
  }

  async sign(
    payload: string
  ): Promise<string> {

    const command =
      new SignCommand({
        KeyId:
          this.keyId,

        Message:
          Buffer.from(
            payload
          ),

        SigningAlgorithm:
          "ECDSA_SHA_256",

        MessageType:
          "RAW",
      });

    const result =
      await this.client.send(
        command
      );

    if (
      !result.Signature
    ) {
      throw new Error(
        "KMS signing failed"
      );
    }

    return Buffer.from(
      result.Signature
    ).toString(
      "base64"
    );
  }
}



