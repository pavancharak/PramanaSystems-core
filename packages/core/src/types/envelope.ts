import type {
  GovernanceMetadata
} from "./metadata";

export interface SignedEnvelope<TPayload> {
  payload: TPayload;

  metadata?: GovernanceMetadata;

  signature: string;
}