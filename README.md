![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![npm](https://img.shields.io/npm/v/@pramanasystems/core)

# PramanaSystems Core

Deterministic governance infrastructure for enforceable, auditable, and independently verifiable AI-driven decisions.

---

## What is PramanaSystems?

PramanaSystems separates:

- AI systems (probabilistic signal generation)
- Governance systems (deterministic enforcement)

It ensures that decisions are:

- reproducible
- verifiable
- replay-safe
- cryptographically attestable

---

## Core Principle

```text
AI → Signals → Deterministic Governance → Attested Decision
```

AI never directly enforces outcomes.

---

## Documentation

- Architecture → `docs/architecture/`
- Governance → `docs/governance/`
- Trust Model → `docs/trust/`
- Verification → `docs/verification/`
- Examples → `examples/`
- 
## Quickstart

Install the portable runtime SDK:

```bash
npm install @pramanasystems/core
```

Example:

```js
import {
  LocalSigner,
  verifyExecutionResult
} from "@pramanasystems/core";

const signer = new LocalSigner();

console.log(signer);
console.log(typeof verifyExecutionResult);
```

Run:

```bash
node verify.mjs
```

---

## Package Ecosystem

| Package | Responsibility |
|---|---|
| `@pramanasystems/core` | Portable runtime SDK and orchestration surface |
| `@pramanasystems/execution` | Deterministic execution runtime |
| `@pramanasystems/verifier` | Independent verification and compatibility validation |
| `@pramanasystems/governance` | Policy lifecycle and governance tooling |
| `@pramanasystems/bundle` | Deterministic artifact generation and canonicalization |
| `@pramanasystems/crypto` | Signing and verification primitives |

---

## Local Development

Install dependencies:

```bash
npm install
```

Build workspace packages:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run full deterministic validation pipeline:

```bash
npm run release:validate
```

---

## Key Properties

- Deterministic execution
- Replay protection
- Fail-closed enforcement
- Immutable provenance
- Independent verification
- Portable governance runtime

---

---

## Documentation

| Document | Purpose |
|---|---|
| `docs/getting-started.md` | External SDK onboarding |
| `docs/verification.md` | Independent verification architecture |
| `examples/quickstart` | Minimal runtime SDK example |
| `examples/decision-flow` | Deterministic governance lifecycle overview |
| `docs/architecture/ARCHITECTURE.md` | Core deterministic governance architecture |
| `docs/trust/TRUST_MODEL.md` | Governance trust assumptions |
| `docs/trust/THREAT_MODEL.md` | Security and adversarial analysis |
| `docs/architecture/PORTABILITY_GUARANTEES.md` | Runtime portability guarantees |
| `docs/verification/RELEASE_VERIFICATION.md` | Reproducible release validation |

## License

Apache-2.0




