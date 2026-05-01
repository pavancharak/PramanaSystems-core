\# PramanaSystems Core



Deterministic governance infrastructure for enforceable, auditable, and independently verifiable AI-driven decisions.



\---



\# Overview



PramanaSystems separates:



\- probabilistic AI signal generation

\- deterministic governance enforcement



The platform ensures that governance decisions remain:



\- deterministic

\- reproducible

\- replay-safe

\- cryptographically attestable

\- independently verifiable



PramanaSystems is designed for environments where governance decisions must be provable, defensible, and operationally trustworthy.



\---



\# Core Principle



```text

AI → Signals → Deterministic Governance → Attested Decision

```



AI systems generate signals.



PramanaSystems deterministically governs enforcement outcomes.



AI never directly determines governance outcomes.



\---



\# Governance Guarantees



PramanaSystems enforces:



\- deterministic execution semantics

\- replay-safe enforcement

\- fail-closed governance behavior

\- immutable provenance guarantees

\- portable verification

\- independently reproducible governance evidence



\---



\# Packages



| Package | Responsibility |

|---|---|

| `@pramanasystems/bundle` | Governance artifacts and manifests |

| `@pramanasystems/crypto` | Signing and verification primitives |

| `@pramanasystems/governance` | Policy lifecycle engine |

| `@pramanasystems/execution` | Deterministic runtime enforcement |

| `@pramanasystems/verifier` | Independent verification tooling |

| `@pramanasystems/core` | Public SDK orchestration layer |



\---



\# Installation



\## Install Core SDK



```bash

npm install @pramanasystems/core

```



\---



\# Quickstart



Create:



```text

verify.mjs

```



Paste:



```js

import {

&#x20; LocalSigner,

&#x20; verifyExecutionResult

} from "@pramanasystems/core";



const signer = new LocalSigner();



console.log("SIGNER CREATED:");

console.log(signer);



console.log("VERIFY FUNCTION EXISTS:");

console.log(typeof verifyExecutionResult);

```



Run:



```bash

node verify.mjs

```



Expected output:



```text

SIGNER CREATED:

LocalSigner { privateKey: undefined }



VERIFY FUNCTION EXISTS:

function

```



\---



\# Examples



Reference governance workflows and verification demonstrations:



| Example | Purpose |

|---|---|

| `examples/quickstart/` | External SDK validation |

| `examples/replay-protection/` | Replay-safe governance enforcement |

| `examples/attestation-verification/` | Portable attestation verification |

| `examples/runtime-provenance/` | Runtime provenance validation |

| `examples/healthcare-triage/` | Regulated governance workflow example |

| `examples/release-verification/` | Release verification workflows |

| `examples/rebuild-verification/` | Reproducibility verification |

| `examples/trust-rotation/` | Trust continuity workflows |



\---



\# Documentation



\## Architecture



\- `docs/architecture/`



\## Governance



\- `docs/governance/`



\## Trust



\- `docs/trust/`



\## Verification



\- `docs/verification/`



\## Runtime



\- `docs/runtime/`



\## Operations



\- `docs/operations/`



\---



\# Deterministic Validation



Validate the complete governance ecosystem:



```bash

npm run release:validate

```



Validation includes:



\- deterministic builds

\- governance verification

\- replay protection validation

\- package generation

\- external consumer execution

\- portable runtime verification

\- clean-room rebuild validation



\---



\# Conformance



PramanaSystems includes governance conformance validation covering:



\- replay invariants

\- fail-closed semantics

\- provenance guarantees

\- deterministic execution

\- compatibility validation

\- portable verification

\- trust continuity



Run:



```bash

npm run test

```



\---



\# Repository Structure



```text

packages/      SDK and runtime packages

docs/          Governance doctrine and architecture

examples/      Reference workflows and demonstrations

tests/         Deterministic conformance validation

tools/         Operational governance tooling

scripts/       Build and governance automation

```



\---



\# Strategic Direction



PramanaSystems focuses on:



\- deterministic governance infrastructure

\- independently verifiable trust

\- portable governance execution

\- runtime provenance validation

\- governance standardization

\- regulated operational enforcement



\---



\# Explicit Non-Goals



PramanaSystems intentionally avoids:



\- opaque governance execution

\- probabilistic enforcement semantics

\- centralized verification dependency

\- hidden trust assumptions

\- infrastructure-coupled governance correctness

\- AI systems directly determining governance outcomes



\---



\# License



Apache-2.0



See:



\- `LICENSE.txt`

\- `NOTICE.txt`



\---



\# Repository



GitHub:



`https://github.com/pavancharak/PramanaSystems-core`


