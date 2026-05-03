# 05 — Verify Attestation

Verify an `ExecutionAttestation` and inspect every verification check in detail.

## What it demonstrates

1. Execute a decision with `executeSimple` to produce a real `ExecutionAttestation`
2. Verify the attestation with `verifyAttestation` — all three checks inspected
3. Show a tampered attestation returning `valid: false`
4. Run a full runtime compatibility check with `verifyRuntimeCompatibility`

## Run

```bash
npx tsx examples/05-verify-attestation/verify-attestation.ts
```

## Prerequisites

Policy `claims-approval/v1` must exist at `./policies/claims-approval/v1/`.

## Packages used

- `@pramanasystems/execution` — `executeSimple`, `LocalSigner`, `LocalVerifier`, `getRuntimeManifest`
- `@pramanasystems/verifier` — `verifyAttestation`, `verifyRuntimeCompatibility`
- `@pramanasystems/governance` — `RuntimeRequirements`
