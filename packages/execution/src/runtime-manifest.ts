import {
  hashRuntime,
} from "./hash-runtime";

export interface RuntimeManifest {
  runtime_version: string;

  runtime_hash: string;

  supported_schema_versions: string[];

  capabilities: string[];
}

export function getRuntimeManifest(): RuntimeManifest {

  return {
    runtime_version:
      "1.0.0",

    runtime_hash:
      hashRuntime(),

    supported_schema_versions: [
      "1.0.0",
    ],

    capabilities: [
      "deterministic-evaluation",

      "attestation-signing",

      "replay-protection",

      "bundle-verification",
    ],
  };
}




