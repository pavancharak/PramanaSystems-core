# 08 — Bundle Verification

Verify a policy bundle's on-disk integrity and confirm the runtime is compatible
with the bundle's declared requirements.

## What it demonstrates

1. Verify bundle integrity with `verifyBundle` — re-hashes all artifacts and checks the Ed25519 manifest signature
2. Check runtime compatibility with `verifyRuntimeCompatibility`
3. Show which checks pass (`manifest_verified`, `signature_verified`, `bundle_verified`)
4. Inspect missing capabilities and version mismatches when they occur

## Run

```bash
npx tsx examples/08-bundle-verification/bundle-verification.ts
```

## Prerequisites

Policy `claims-approval/v1` must exist at `./policies/claims-approval/v1/` with a valid
`bundle.manifest.json` and `bundle.sig`.  These are committed to the repository.

## Packages used

- `@pramanasystems/verifier` — `verifyBundle`, `verifyRuntimeCompatibility`
- `@pramanasystems/governance` — `RuntimeRequirements`
- `@pramanasystems/execution` — `getRuntimeManifest`
