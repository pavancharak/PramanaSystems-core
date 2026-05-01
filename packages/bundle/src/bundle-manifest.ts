import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

export interface BundleArtifact {
  hash: string;

  path: string;
}

export interface BundleManifest {
  artifacts: BundleArtifact[];

  bundle_hash: string;

  manifest_version: string;

  policy_id: string;

  policy_version: string;

  runtime_requirements:
    RuntimeRequirements;
}




