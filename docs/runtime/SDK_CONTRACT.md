\# SDK Contract



The pramanasystems SDK exposes stable deterministic governance interfaces for:



\- governance lifecycle management

\- deterministic execution

\- portable verification

\- runtime certification

\- governance provenance validation



The SDK intentionally exposes a minimal stable surface.



Low-level implementation details remain internal to preserve:



\- deterministic semantics

\- compatibility guarantees

\- governance portability

\- operational stability



\---



\# Stable Public APIs



\## Governance Lifecycle



```ts

createPolicy

upgradePolicy

validatePolicy

generateBundle



Purpose:



policy creation

immutable policy lineage

governance bundle generation

deterministic policy validation

Deterministic Execution

executeDecision

issueExecutionToken

verifyExecutionToken

signExecutionResult

verifyExecutionResult

getRuntimeManifest

signRuntimeManifest

verifyRuntimeManifest



Purpose:



deterministic governance execution

replay-safe execution

portable attestation generation

runtime provenance

deterministic verification

Runtime Utilities

LocalSigner

LocalVerifier

MemoryReplayStore



Purpose:



local deterministic signing

portable verification

replay protection

Portable Verification

verifyAttestation

verifyBundle

verifyRuntime

verifyRuntimeCompatibility

verifyExecutionRequirements



Purpose:



independent governance verification

runtime compatibility validation

governance provenance verification

deterministic evidence validation

Stable Public Types

Execution Types

ExecutionContext

ExecutionResult

ExecutionAttestation

ExecutionToken



Purpose:



deterministic execution contracts

portable governance evidence

replay-safe execution semantics

Runtime Types

RuntimeManifest

RuntimeRequirements

ExecutionRequirements



Purpose:



runtime certification

governance compatibility semantics

deterministic runtime validation

Verification Types

Signer

Verifier

ReplayStore



Purpose:



portable trust semantics

deterministic signing

replay protection

Stability Guarantees



The SDK guarantees:



deterministic execution semantics

replay-safe governance execution

portable governance verification

immutable provenance semantics

stable public governance contracts

Compatibility Philosophy



Public SDK contracts are treated as governance compatibility obligations.



Changes to public deterministic governance semantics require:



explicit compatibility review

semantic versioning consideration

governance conformance validation

Internal APIs



The following remain intentionally internal:



canonical serialization internals

low-level cryptographic primitives

hashing internals

runtime implementation details

execution plumbing helpers



This preserves:



implementation flexibility

deterministic compatibility guarantees

governance portability stability





