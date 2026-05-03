# 02 — Local Signer

Generating an Ed25519 key pair and using `LocalSigner` / `LocalVerifier` directly.

## What it demonstrates

1. Generate a fresh Ed25519 key pair with Node.js `crypto`
2. Sign an arbitrary canonical payload with `LocalSigner`
3. Verify the signature with `LocalVerifier`
4. Show how `canonicalize` produces deterministic bytes regardless of object key order

## Run

```bash
npx tsx examples/02-local-signer/local-signer.ts
```

## Packages used

- `@pramanasystems/execution` — `LocalSigner`, `LocalVerifier`
- `@pramanasystems/bundle` — `canonicalize`
