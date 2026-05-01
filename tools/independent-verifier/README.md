\# Independent Verifier



This verifier demonstrates portable deterministic governance verification.



Verification operates independently of:



\- runtime infrastructure

\- databases

\- orchestration systems

\- APIs

\- hosted services



The verifier validates governance artifacts using only:



\- governance evidence

\- deterministic payload reconstruction

\- cryptographic signatures

\- trusted public keys



\---



\# Verification Guarantees



The verifier validates:



\- execution attestation integrity

\- deterministic execution evidence

\- portable governance provenance

\- cryptographic authenticity

\- independent verification semantics



\---



\# Files



\## verify-attestation.mjs



Verifies deterministic execution attestations.



Inputs:



\- execution.attestation.json

\- trust/PramanaSystems-root.pub



Output:



\- deterministic verification result



\---



\## generate-attestation.mjs



Generates a deterministic execution attestation signed by the trust root.



Inputs:



\- trust/PramanaSystems-root.key



Outputs:



\- execution.attestation.json



\---



\# Example



Generate attestation:



```bash

node .\\tools\\independent-verifier\\generate-attestation.mjs




