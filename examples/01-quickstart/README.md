# 01 — Quickstart

The shortest path to a signed, independently verifiable governance decision.

## What it demonstrates

1. Generate an ephemeral Ed25519 key pair (no key files required)
2. Execute a governance decision against the `claims-approval` policy using `executeSimple`
3. Verify the returned `ExecutionAttestation` with `verifyAttestation`
4. Inspect all three verification checks: signature, runtime, schema

## Run

```bash
npx tsx examples/01-quickstart/quickstart.ts
```

## Packages used

- `@pramanasystems/execution` — `executeSimple`, `LocalSigner`, `LocalVerifier`, `getRuntimeManifest`
- `@pramanasystems/verifier` — `verifyAttestation`
