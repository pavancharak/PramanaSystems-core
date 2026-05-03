# PramanaSystems Examples

Runnable TypeScript examples covering the complete governance lifecycle.
Each example is self-contained and executable from the repository root with `npx tsx`.

---

## Prerequisites

```bash
# From the repository root
npm ci
npm run build
```

All examples reference published package names resolved through the npm workspace.
A running `@pramanasystems/server` is only required for example 06.

---

## Examples

| # | Directory | Description | Run command |
|---|---|---|---|
| 01 | `01-quickstart` | Minimal end-to-end: generate keys, execute a decision, verify the attestation | `npx tsx examples/01-quickstart/quickstart.ts` |
| 02 | `02-local-signer` | Generate an Ed25519 key pair, sign arbitrary payloads, verify signatures | `npx tsx examples/02-local-signer/local-signer.ts` |
| 03 | `03-define-policy` | Define a governance policy in memory, write it to disk, and generate a signed bundle | `npx tsx examples/03-define-policy/define-policy.ts` |
| 04 | `04-execute-decision` | Full `executeDecision` pipeline: issue token, sign, verify, execute, attest | `npx tsx examples/04-execute-decision/execute-decision.ts` |
| 05 | `05-verify-attestation` | Verify an `ExecutionAttestation` and inspect all three verification checks | `npx tsx examples/05-verify-attestation/verify-attestation.ts` |
| 06 | `06-http-client` | Use `PramanaClient` to call a live server: health, execute, verify | `npx tsx examples/06-http-client/http-client.ts` |
| 07 | `07-aws-kms-signer` | Async execution pipeline using AWS KMS (ECDSA_SHA_256); skips if credentials absent | `npx tsx examples/07-aws-kms-signer/aws-kms-signer.ts` |
| 08 | `08-bundle-verification` | Verify a policy bundle's on-disk integrity and runtime compatibility | `npx tsx examples/08-bundle-verification/bundle-verification.ts` |

---

## Package reference

| Package | Purpose |
|---|---|
| `@pramanasystems/core` | Umbrella SDK — re-exports governance, execution, and verification APIs |
| `@pramanasystems/execution` | Deterministic runtime, token lifecycle, signing, replay protection |
| `@pramanasystems/governance` | Policy authoring, bundle generation, policy validation |
| `@pramanasystems/verifier` | Independent verification of attestations, bundles, and runtime compatibility |
| `@pramanasystems/crypto` | Ed25519 key loading and signature primitives |
| `@pramanasystems/bundle` | Canonical serialization, manifest hashing |
| `@pramanasystems/sdk-client` | Type-safe HTTP client for the governance REST API |
