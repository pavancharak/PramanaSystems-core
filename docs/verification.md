\# Independent Verification



PramanaSystems separates:



\- decision generation

\- governance enforcement

\- independent verification



This enables externally provable deterministic governance decisions.



\---



\## Verification Goals



Every governed decision should be:



\- reproducible

\- replay-safe

\- cryptographically attestable

\- independently verifiable



\---



\## Core Verification Properties



\### Deterministic Evaluation



The same:



\- policy

\- signals

\- runtime

\- governance artifacts



must always produce the same decision.



\---



\### Replay Protection



Execution tokens are replay-safe and reject duplicate execution attempts.



\---



\### Runtime Provenance



Execution environments can be verified through runtime manifests and signed attestations.



\---



\### Independent Verification



Verification can occur outside the originating runtime or infrastructure boundary.



\---



\## Verification Flow



```text

Decision

→ Attestation

→ Runtime Manifest

→ Independent Verifier

→ Verified Result

```



\---



\## Portable Verification



Verification workflows are externally consumable through:



```bash

npm install @pramanasystems/verifier

```



or:



```bash

npm install @pramanasystems/core

```



\---



\## Validation Status



The ecosystem has been validated through:



\- external clean-room npm installation

\- independent runtime verification

\- deterministic conformance testing

\- GitHub Actions governance CI

\- reproducible package validation



