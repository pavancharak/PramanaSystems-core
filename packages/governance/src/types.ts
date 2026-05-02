export interface BundleGenerationResult {
  success: boolean;

  manifest_path: string;

  signature_path: string;

  bundle_hash: string;
}

export interface PolicyRule {
  id: string;

  condition: string;

  action: string;
}

export interface PolicyDefinition {
  id: string;

  version: string;

  rules: PolicyRule[];
}




