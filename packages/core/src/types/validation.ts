export interface ValidationStages {
  structure: boolean;

  canonical: boolean;

  deterministic: boolean;

  metadataIsolation: boolean;

  cryptographic: boolean;
}

export interface ValidationResult {
  valid: boolean;

  verified: boolean;

  stages: ValidationStages;

  errors: string[];
}