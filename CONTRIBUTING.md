\# Contributing to PramanaSystems



\## Purpose



PramanaSystems is deterministic governance infrastructure.



Contributions must preserve:



\- deterministic execution

\- replay-safe enforcement

\- fail-closed behavior

\- immutable provenance

\- portable verification

\- independently reproducible governance evidence

\- compatibility discipline



Governance correctness is prioritized over feature velocity.



\---



\# Contribution Philosophy



PramanaSystems is not a generic workflow engine.



It is deterministic governance infrastructure for enforceable decisions requiring independently verifiable trust.



Architectural consistency is mandatory.



\---



\# Before Contributing



Contributors should read:



\- README.md

\- docs/README.md

\- docs/architecture/ARCHITECTURE.md

\- docs/governance/CONFORMANCE\_MODEL.md

\- docs/runtime/RUNTIME\_CERTIFICATION.md

\- docs/verification/VERIFICATION\_MODEL.md



Understanding deterministic governance semantics is required before modifying core infrastructure.



\---



\# Required Validation



All contributions MUST pass:



```bash

npm test

npm run check

npm run release:validate

Governance Invariants



Contributions MUST NOT weaken:



deterministic reproducibility

replay protection

fail-closed semantics

immutable provenance

runtime compatibility enforcement

portable verification

trust continuity semantics



These are governance invariants.



Compatibility Discipline



Public governance contracts are compatibility-sensitive.



Changes affecting:



ExecutionToken

ExecutionContext

ExecutionResult

ExecutionAttestation

RuntimeManifest

RuntimeRequirements



require compatibility review.



Breaking governance semantics requires explicit major-version consideration.



Operational Principle



Governance infrastructure must remain independently verifiable without centralized trust dependency.



Operational simplicity is preferred over unnecessary abstraction complexity.



