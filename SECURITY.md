\# Security Policy



\## Purpose



PramanaSystems is deterministic governance infrastructure for enforceable decisions requiring independently verifiable trust.



Security vulnerabilities may affect:



\- deterministic execution guarantees

\- replay-safe enforcement

\- immutable provenance

\- portable verification

\- trust continuity

\- governance integrity



Security correctness is treated as governance correctness.



\---



\# Security Philosophy



PramanaSystems prioritizes:



\- deterministic behavior

\- fail-closed semantics

\- explicit trust boundaries

\- immutable governance evidence

\- independently reproducible verification

\- portable trust



The system is intentionally designed to minimize hidden trust assumptions.



\---



\# Security Scope



Security-sensitive components include:



\- signing and verification primitives

\- execution attestations

\- runtime manifests

\- trust-root continuity

\- replay protection

\- canonical serialization

\- governance provenance

\- release verification



\---



\# Vulnerability Reporting



Please report security vulnerabilities responsibly.



Include:



\- affected component

\- deterministic reproduction steps

\- security impact

\- compatibility implications

\- trust implications



Avoid public disclosure before remediation coordination when possible.



\---



\# Trust Assumptions



PramanaSystems assumes:



\- trusted cryptographic primitives

\- trusted governance signing keys

\- deterministic runtime execution

\- immutable signed governance artifacts



PramanaSystems intentionally avoids:



\- centralized trust dependency

\- hidden verification infrastructure

\- opaque governance execution



\---



\# Operational Principle



Verification must remain independently executable.



Governance trust must remain portable.



Security mitigations must preserve deterministic governance semantics.

``` id="6v3nwr"



\---



\# Then Validate



Run:



```powershell id="2q7xzp"

npm run release:validate



