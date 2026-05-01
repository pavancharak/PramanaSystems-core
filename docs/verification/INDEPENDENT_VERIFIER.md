\# Independent Verifier## PurposeThe pramanasystems Independent Verifier provides portable governance verification without centralized trust dependency.Verification remains independently executable using only:- governance evidence- deterministic payload reconstruction- immutable signed bytes- trusted public keysVerification does NOT require:- hosted APIs- orchestration systems- centralized infrastructure- vendor-controlled services---# Verification PhilosophyThe verifier operationalizes one of pramanasystems’s core architectural guarantees:> independently reproducible governance trust.External systems must be able to validate governance integrity without trusting infrastructure ownership.---# Verifier Location```texttools/independent-verifier/



Supported Verification Operations

Verify Release Provenance

node tools/independent-verifier/index.mjs verify-release

Validates:





release manifests





release signatures





deterministic provenance integrity







Verify Execution Attestation

node tools/independent-verifier/index.mjs verify-attestation

Validates:





execution attestations





execution signatures





deterministic governance evidence







Verify Runtime Identity

node tools/independent-verifier/index.mjs verify-runtime

Validates:





runtime manifests





runtime identity





runtime compatibility evidence







Verification Guarantees

Independent verification preserves:





deterministic trust semantics





immutable provenance





portable verification





independently reproducible governance evidence





fail-closed verification behavior







Operational Principle

Verification must remain executable independently of infrastructure ownership.

Governance trust must remain portable.

\---# Then Update Documentation IndexOpen:```text id="6v3nwr"D:\\last\\pramanasystems-core\\docs\\README.md

and under:

\## Verification

add:

\- INDEPENDENT\_VERIFIER.md



Then Validate

Run:

npm run release:validate



Why This Matters

You are now documenting:



operationally independent governance verification.



That is one of pramanasystems’s strongest architectural differentiators.






