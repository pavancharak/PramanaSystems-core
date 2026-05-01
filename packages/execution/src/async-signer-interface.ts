export interface AsyncSigner {
  sign(
    payload: string
  ): Promise<string>;
}




