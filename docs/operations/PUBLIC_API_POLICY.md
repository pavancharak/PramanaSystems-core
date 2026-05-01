\# pramanasystems Public API Policy



\## Purpose



This document defines the public compatibility surface for pramanasystems deterministic governance infrastructure.



Public governance contracts are compatibility-sensitive trust interfaces.



They are treated as long-term governance obligations.



\---



\# Public Governance Contracts



The following contracts are considered public governance interfaces:



\- ExecutionToken

\- ExecutionContext

\- ExecutionResult

\- ExecutionAttestation

\- RuntimeManifest

\- RuntimeRequirements

\- ExecutionRequirements

\- Signer

\- Verifier

\- ReplayStore



Changes affecting these contracts require compatibility review.



\---



\# Stability Philosophy



pramanasystems prioritizes:



\- semantic stability

\- deterministic reproducibility

\- portable verification

\- independently verifiable governance evidence

\- long-term compatibility discipline



Compatibility stability is preferred over rapid interface expansion.



\---



\# Compatibility Expectations



Public governance semantics MUST preserve:



\- deterministic execution behavior

\- replay-safe guarantees

\- immutable provenance semantics

\- fail-closed behavior

\- runtime compatibility enforcement

\- portable verification guarantees

\- trust continuity semantics



\---



\# Non-Public Internals



The following are NOT considered stable compatibility interfaces unless explicitly documented:



\- internal helper utilities

\- implementation-specific file layouts

\- temporary development tooling

\- experimental workflows

\- internal testing helpers

\- transient build structures



These may evolve without compatibility guarantees.



\---



\# Verification Philosophy



Portable verification MUST remain executable using only:



\- deterministic payload reconstruction

\- immutable signed bytes

\- governance evidence

\- trusted public keys



Verification MUST NOT require:



\- centralized APIs

\- hosted infrastructure

\- orchestration systems

\- vendor-controlled services



\---



\# Governance Principle



pramanasystems provides deterministic governance infrastructure for enforceable decisions requiring independently verifiable trust.



AI systems generate signals.



pramanasystems governs enforcement deterministically.

``` id="wpy3vn"



\---



\# Then Validate



Run:



```powershell id="6v3nwr"

npm run release:validate





