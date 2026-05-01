import { canonicalize }
  from "../../bundle/src/canonicalize";

export function canonicalizeForSigning(
  value: unknown
): string {

  return canonicalize(value);
}




