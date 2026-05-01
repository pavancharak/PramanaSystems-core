\# pramanasystems Core Boundary Specification



\## Purpose



`@pramanasystems/core` is the deterministic governance kernel of pramanasystems.



It defines governance semantics.



It does NOT define deployment infrastructure.



\---



\# Core Responsibilities



The core owns ONLY deterministic governance semantics.



\---



\## Included In Core



\### Canonicalization



\* canonical serialization

\* deterministic UTF-8 encoding

\* hashing semantics



\---



\### Cryptographic Governance



\* signing

\* verification

\* trust roots

\* attestations

\* execution proofs



\---



\### Governance Semantics



\* policy evaluation

\* deterministic execution

\* governed signals

\* immutable lineage

\* replay protection

\* execution requirements

\* runtime requirements



\---



\### Runtime Provenance



\* runtime manifests

\* compatibility semantics

\* runtime verification

\* provenance continuity



\---



\### Verification Semantics



\* attestation verification

\* bundle verification

\* compatibility verification

\* replay-safe validation



\---



\# Explicitly Excluded From Core



These belong outside the governance kernel.



\---



\## Runtime Hosting



\* Fastify

\* Express

\* HTTP APIs

\* OpenAPI

\* Swagger

\* controllers

\* middleware



\---



\## Observability



\* logging

\* tracing

\* telemetry

\* metrics



\---



\## Infrastructure Adapters



\* Redis

\* AWS KMS

\* databases

\* queues

\* cloud providers



\---



\## Deployment



\* Docker

\* Kubernetes

\* ECS

\* cloud deployment logic



\---



\# Architectural Principle



The governance kernel must remain:



\* deterministic

\* portable

\* infrastructure-independent

\* replay-safe

\* semantically stable



\---



\# Core Invariants



same semantic input

→ same governance output



same governance artifact

→ same signature



same attestation

→ same verification result



governance truth

must not depend on runtime ownership



governance ambiguity

must fail closed








