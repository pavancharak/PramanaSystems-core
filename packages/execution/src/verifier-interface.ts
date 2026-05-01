export interface Verifier {
  verify(
    payload: string,
    signature: string
  ): boolean;
}



