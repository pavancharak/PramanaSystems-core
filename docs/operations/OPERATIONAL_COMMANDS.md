\# pramanasystems Operational Commands



\## Purpose



This document defines the canonical operational command surface for pramanasystems deterministic governance infrastructure.



Operational commands are part of the governance lifecycle.



They are treated as operational governance interfaces rather than ad-hoc developer utilities.



\---



\# Core Validation Commands



\## Run Conformance Validation



```bash

npm test



Runs invariant-oriented conformance validation.



Validates:



deterministic execution

replay protection

fail-closed behavior

provenance reconstruction

runtime compatibility

trust continuity

portable verification

Run Governance Validation

npm run check



Runs:



type validation

conformance validation

OpenAPI export validation

Run Full Release Validation

npm run release:validate



Authoritative release governance validation.



Validates:



deterministic builds

conformance invariants

SDK portability

external consumer interoperability

package generation

release readiness



This command is the canonical governance release gate.



Release Governance Commands

Generate Release Manifest

npm run release:manifest



Generates deterministic release provenance metadata.



Sign Release Manifest

npm run release:sign



Signs immutable release provenance artifacts.



Verify Release Integrity

npm run release:verify



Performs portable release verification.



Generate Rebuild Attestation

npm run release:attest



Generates independently verifiable rebuild evidence.



Trust Governance Commands

Generate Trust Root

npm run trust:generate



Creates deterministic trust-root artifacts.



Verify Trust Continuity

npm run trust:verify



Verifies release integrity against trusted governance anchors.



Rotate Trust Root

npm run trust:rotate



Performs signed trust continuity transitions.



Operational Philosophy



Operational workflows MUST preserve:



deterministic semantics

immutable provenance

replay-safe enforcement

fail-closed governance behavior

portable verification

independently reproducible trust



Operational procedures are governance obligations.



They are not merely developer conveniences.





\---



\# Then Validate



Run:



```powershell id="6v3nwr"

npm run release:validate

Why This Matters



At this stage, you are formalizing:



operational semantics

release discipline

governance lifecycle expectations

trust assumptions

compatibility procedures





