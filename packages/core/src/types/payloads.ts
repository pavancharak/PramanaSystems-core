export interface ReleasePayload {
  version: string;
  artifacts: string[];
}

export interface RuntimePayload {
  runtime: string;
  version: string;
  compatibility: string[];
}

export interface AttestationPayload {
  decision: string;
  policyVersion: string;
  timestamp: string;
}