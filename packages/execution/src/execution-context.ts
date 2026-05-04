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

/**
 * Full context required by {@link executeDecision}.
 *
 * execution_requirements has been removed. All governance properties
 * (replay protection, attestation issuance, audit chain, independent
 * verification) are structurally enforced inside executeDecision.
 * They are not configurable. Enforces: META-001, INV-013, INV-014,
 * INV-015, INV-033.
 */
export interface ExecutionContext {
  /** The pre-issued, time-limited execution token. */
  token: ExecutionToken;

  /** Base64 Ed25519 signature over the canonical token. */
  token_signature: string;

  /** Signer used to sign the ExecutionResult. */
  signer: Signer;

  /** Verifier used to authenticate the execution token. */
  verifier: Verifier;

  /** Manifest describing the currently active governance runtime. */
  runtime_manifest: RuntimeManifest;

  /** Version and capability constraints the runtime must satisfy. */
  runtime_requirements: RuntimeRequirements;
}



