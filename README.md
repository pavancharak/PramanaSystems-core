![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![npm](https://img.shields.io/npm/v/@pramanasystems/core)


<p align="center">
  <img src="./assets/governance-banner.png" alt="Pramana Systems Banner" />
</p>

# PramanaSystems Core

Deterministic governance infrastructure for enforceable, auditable, and independently verifiable AI-driven decisions.

---

## What is PramanaSystems?

PramanaSystems separates AI signal generation from governance enforcement.

```
AI → Signals → Deterministic Governance → Attested Decision
                        │
              ┌─────────┴─────────┐
              │  Execution Token  │
              │  Signed Result    │
              │  Replay Guard     │
              └─────────┬─────────┘
                        │
              Independent Verification
```

AI never directly enforces outcomes. Every governance decision is:

- **Deterministic** — same inputs always produce the same signed result
- **Replay-safe** — each execution token is consumed exactly once
- **Cryptographically attested** — results are signed at execution time
- **Independently verifiable** — any party can verify without trusting the runtime

---

## Quickstart

### Embedded SDK

```bash
npm install @pramanasystems/core
```

```ts
import { executeDecision, LocalSigner, LocalVerifier } from "@pramanasystems/core";

const signer   = new LocalSigner();
const verifier = new LocalVerifier(signer.publicKeyPem);

const { attestation } = executeDecision(
  "loan-approval", "v1", "approve", "abc123signals",
  signer
);

console.log(attestation.result.decision);  // "approve"
console.log(attestation.signature);        // base64 Ed25519 signature
```

### HTTP Server

```bash
npm install @pramanasystems/server
npx pramana-server          # listens on :3000
```

### Typed HTTP Client

```bash
npm install @pramanasystems/sdk-client
```

```ts
import { PramanaClient } from "@pramanasystems/sdk-client";

const client = new PramanaClient({ baseUrl: "http://localhost:3000" });

const attestation = await client.execute({
  policy_id:      "loan-approval",
  policy_version: "v1",
  decision_type:  "approve",
  signals_hash:   "abc123signals",
});

const result = await client.verify(attestation);
console.log(result.valid);  // true
```

---

## Package Ecosystem

| Package | npm | Purpose |
|---|---|---|
| [`@pramanasystems/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@pramanasystems/core)](https://www.npmjs.com/package/@pramanasystems/core) | Portable runtime SDK — single install for governance lifecycle + execution + verification |
| [`@pramanasystems/execution`](packages/execution) | [![npm](https://img.shields.io/npm/v/@pramanasystems/execution)](https://www.npmjs.com/package/@pramanasystems/execution) | Deterministic execution runtime — tokens, signing, replay protection |
| [`@pramanasystems/verifier`](packages/verifier) | [![npm](https://img.shields.io/npm/v/@pramanasystems/verifier)](https://www.npmjs.com/package/@pramanasystems/verifier) | Independent attestation verification |
| [`@pramanasystems/governance`](packages/governance) | [![npm](https://img.shields.io/npm/v/@pramanasystems/governance)](https://www.npmjs.com/package/@pramanasystems/governance) | Policy lifecycle and governance tooling |
| [`@pramanasystems/bundle`](packages/bundle) | [![npm](https://img.shields.io/npm/v/@pramanasystems/bundle)](https://www.npmjs.com/package/@pramanasystems/bundle) | Deterministic artifact canonicalization and hashing |
| [`@pramanasystems/crypto`](packages/crypto) | [![npm](https://img.shields.io/npm/v/@pramanasystems/crypto)](https://www.npmjs.com/package/@pramanasystems/crypto) | Signing and verification primitives |
| [`@pramanasystems/server`](packages/server) | [![npm](https://img.shields.io/npm/v/@pramanasystems/server)](https://www.npmjs.com/package/@pramanasystems/server) | Fastify REST API server — HTTP wrapper over the execution runtime |
| [`@pramanasystems/sdk-client`](packages/sdk-client) | [![npm](https://img.shields.io/npm/v/@pramanasystems/sdk-client)](https://www.npmjs.com/package/@pramanasystems/sdk-client) | Type-safe fetch client for the HTTP server |
| [`@pramanasystems/verifier-cli`](packages/verifier-cli) | [![npm](https://img.shields.io/npm/v/@pramanasystems/verifier-cli)](https://www.npmjs.com/package/@pramanasystems/verifier-cli) | CLI tool for offline attestation verification |

### Dependency graph

```
sdk-client  server  verifier-cli
               │         │
               ▼         ▼
             core ◄──────┘
            / │ \
    execution │ verifier
        │    governance
       bundle + crypto
```

---

## Local Development

```bash
npm install         # install all workspace dependencies
npm run build       # build all packages (turbo, respects dep order)
npm test            # run all tests
npm run check       # typecheck + lint
npm run release:validate   # full deterministic validation pipeline
```

### AWS KMS integration tests

```bash
AWS_KMS_KEY_ID=<key-id>  AWS_ACCESS_KEY_ID=<key>  AWS_SECRET_ACCESS_KEY=<secret>  AWS_REGION=us-east-1 \
npx vitest run tests/integration/aws-kms
```

See [tests/integration/aws-kms/README.md](tests/integration/aws-kms/README.md) for full setup instructions.

---

## Documentation

| Document | Purpose |
|---|---|
| [`docs/getting-started.md`](docs/getting-started.md) | External onboarding guide |
| [`docs/verification.md`](docs/verification.md) | Independent verification guide |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | Core deterministic governance architecture |
| [`docs/trust/TRUST_MODEL.md`](docs/trust/TRUST_MODEL.md) | Governance trust assumptions |
| [`docs/trust/THREAT_MODEL.md`](docs/trust/THREAT_MODEL.md) | Security and adversarial analysis |
| [`docs/verification/RELEASE_VERIFICATION.md`](docs/verification/RELEASE_VERIFICATION.md) | Reproducible release validation |
| [`docs/architecture/PORTABILITY_GUARANTEES.md`](docs/architecture/PORTABILITY_GUARANTEES.md) | Runtime portability guarantees |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution guide |
| [`SECURITY.md`](SECURITY.md) | Vulnerability reporting |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |

---

## License

Apache-2.0
