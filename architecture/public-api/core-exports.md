\# Proposed @pramanasystems/core Export Surface



\## Governance Lifecycle



\* createPolicy

\* upgradePolicy

\* validatePolicy

\* generateBundle



\---



\## Deterministic Execution



\* execute

\* issueToken

\* verifyToken

\* signExecutionResult

\* verifyExecutionResult



\---



\## Independent Verification



\* verifyAttestation

\* verifyBundle

\* verifyRuntime

\* verifyRuntimeCompatibility



\---



\## Canonical Governance Primitives



\* canonicalize

\* hash

\* sign

\* verify



\---



\## Runtime Provenance



\* runtimeManifest

\* signRuntimeManifest

\* verifyRuntimeManifest



\---



\# Explicitly NOT Public Initially



The following remain internal until stabilization maturity:



\* memoryReplayStore

\* replayStoreInterface

\* asyncReplayStoreInterface

\* localSigner

\* localVerifier

\* executionContext

\* hashRuntime



\---



\# Public API Philosophy



Public exports must represent stable deterministic governance semantics.



Internal execution plumbing must remain replaceable without ecosystem breakage.







