\# pramanasystems Versioning Policy



\## Purpose



This document defines compatibility and versioning expectations for pramanasystems deterministic governance infrastructure.



Versioning is treated as a governance compatibility contract.



\---



\# Versioning Philosophy



pramanasystems prioritizes:



\- deterministic reproducibility

\- governance stability

\- portable verification

\- independently verifiable trust

\- compatibility discipline



Compatibility preservation is preferred over rapid interface expansion.



\---



\# Semantic Versioning



pramanasystems follows semantic versioning:



```text

MAJOR.MINOR.PATCH

Major Versions



Major versions are required for governance-breaking changes.



Examples include:



ExecutionToken semantic changes

ExecutionContext incompatibilities

attestation structure changes

replay semantics changes

provenance model changes

runtime certification semantic changes

trust continuity semantic changes

verification model incompatibilities



Major versions indicate potential governance incompatibility.



Minor Versions



Minor versions introduce backward-compatible improvements.



Examples include:



additive capabilities

new verifier adapters

operational tooling improvements

documentation improvements

optional runtime enhancements

additive metadata fields preserving compatibility



Minor releases MUST preserve existing governance semantics.



Patch Versions



Patch versions are reserved for:



bug fixes

implementation corrections

deterministic stability fixes

non-breaking operational hardening

documentation corrections

internal implementation cleanup



Patch releases MUST NOT alter governance semantics.



Compatibility Requirements



Public governance contracts MUST preserve:



deterministic execution behavior

replay-safe guarantees

fail-closed behavior

immutable provenance semantics

portable verification guarantees

runtime compatibility semantics

trust continuity semantics

Governance Compatibility Principle



Governance evidence produced under compatible versions MUST remain independently verifiable without centralized trust dependency.



Operational Principle



Versioning decisions are governance decisions.



They are not merely release-management conventions.





\---



\# Then Validate



Run:



```powershell id="6v3nwr"

npm run release:validate





