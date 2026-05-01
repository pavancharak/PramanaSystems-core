import { canonicalize } from "./canonicalize";

import {
  assertNoOperationalMetadata
} from "./invariants";

import {
  forbiddenDeterministicFields
} from "./deterministic-policy";

import {
  ValidatorConfig
} from "./types/validator-config";

import { ValidationResult } from "./types/validation";

import { SignedEnvelope } from "./types/envelope";

export class LocalValidator {

  private readonly config:
    ValidatorConfig;

  constructor(
    config: ValidatorConfig = {}
  ) {
    this.config = {
      forbiddenDeterministicFields,
      ...config
    };
  }

  private extractDeterministicPayload(
    envelope: SignedEnvelope<unknown>
  ): unknown {
    return envelope.payload;
  }

  validateStructure(
    envelope: SignedEnvelope<unknown>
  ): boolean {

    return (
      typeof envelope === "object" &&
      envelope !== null &&
      "payload" in envelope &&
      "signature" in envelope &&
      typeof envelope.signature === "string"
    );
  }

  validateCanonical(
    payload: unknown
  ): boolean {

    try {

      canonicalize(payload);

      return true;

    } catch {

      return false;
    }
  }

  validateMetadataIsolation(
    envelope: SignedEnvelope<unknown>
  ): boolean {

    try {

      const canonicalPayload =
        canonicalize(
          this.extractDeterministicPayload(
            envelope
          )
        );

      const canonicalEnvelope =
        canonicalize({
          payload:
            this.extractDeterministicPayload(
              envelope
            )
        });

      return (
        canonicalPayload ===
        canonicalEnvelope
      );

    } catch {

      return false;
    }
  }

  validate(
    envelope: SignedEnvelope<unknown>
  ): ValidationResult {

    const structure =
      this.validateStructure(
        envelope
      );

    const canonical =
      structure &&
      this.validateCanonical(
        envelope.payload
      );

    const deterministic =
      structure &&
      assertNoOperationalMetadata(
        envelope.payload,
        this.config
          .forbiddenDeterministicFields ??
          []
      );

    const metadataIsolation =
      structure &&
      this.validateMetadataIsolation(
        envelope
      );

    const cryptographic =
      false;

    const errors: string[] =
      [];

    if (!structure) {
      errors.push(
        "Invalid structure."
      );
    }

    if (!canonical) {
      errors.push(
        "Canonicalization validation failed."
      );
    }

    if (!deterministic) {
      errors.push(
        "Operational metadata contamination detected."
      );
    }

    if (!metadataIsolation) {
      errors.push(
        "Metadata isolation validation failed."
      );
    }

    return {
      valid:
        structure &&
        canonical &&
        deterministic &&
        metadataIsolation &&
        cryptographic,

      verified:
        cryptographic,

      stages: {
        structure,
        canonical,
        deterministic,
        metadataIsolation,
        cryptographic
      },

      errors
    };
  }
}