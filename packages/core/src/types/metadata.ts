 	export interface OperationalMetadata {
  generatedAt?: string;

  environment?: string;

  host?: string;

  runtime?: string;

  traceId?: string;
}

export interface ProvenanceMetadata {
  runtimeVersion?: string;

  bundleHash?: string;

  trustRootVersion?: string;

  buildId?: string;
}

export interface GovernanceMetadata {
  operational?: OperationalMetadata;

  provenance?: ProvenanceMetadata;
}