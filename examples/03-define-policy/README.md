# 03 — Define Policy

Define a governance policy in memory, scaffold it to disk, and generate a signed bundle.

## What it demonstrates

1. Use `definePolicy` to construct an in-memory `PolicyDefinition`
2. Scaffold a new policy directory with `createPolicy`
3. Write policy rules to `policy.json` on disk
4. Generate a signed bundle with `generateBundle` (requires `./dev-keys/bundle_signing_key`)
5. Clean up the temporary policy directory after the demonstration

## Run

```bash
npx tsx examples/03-define-policy/define-policy.ts
```

## Prerequisites

The bundle signing key must be present at `./dev-keys/bundle_signing_key`.
This file is generated automatically by the repo setup scripts and is
excluded from git — it lives only on disk.

## Packages used

- `@pramanasystems/governance` — `definePolicy`, `createPolicy`, `generateBundle`
