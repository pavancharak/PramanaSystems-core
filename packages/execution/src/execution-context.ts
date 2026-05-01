import type {
  ExecutionToken,
} from "./execution-token";

import type {
  Signer,
} from "./signer-interface";

import type {
  Verifier,
} from "./verifier-interface";

import type {
  RuntimeManifest,
} from "./runtime-manifest";

import type {
  RuntimeRequirements,
} from "@pramanasystems/governance";

import type {
  ExecutionRequirements,
} from "@pramanasystems/governance";

export interface ExecutionContext {

  token: ExecutionToken;

  token_signature: string;

  signer: Signer;

  verifier: Verifier;

  runtime_manifest: RuntimeManifest;

  runtime_requirements: RuntimeRequirements;

  execution_requirements: ExecutionRequirements;
}



