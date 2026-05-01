\# pramanasystems Core SDK Philosophy



\## Goal



`@pramanasystems/core` provides the stable public deterministic governance API.



Internal package topology must not define external developer ergonomics.



\---



\# Internal Architecture



Internal packages remain modular:



\* @pramanasystems/bundle

\* @pramanasystems/crypto

\* @pramanasystems/governance

\* @pramanasystems/execution

\* @pramanasystems/verifier



These packages define internal deterministic boundaries.



\---



\# Public Consumption Model



External systems consume:



\* @pramanasystems/core



The umbrella package re-exports stable governance primitives.



\---



\# Public API Goals



The public API must be:



\* deterministic

\* minimal

\* explicit

\* replay-safe

\* semantically stable

\* infrastructure-independent



\---



\# Public API Must Avoid



\* infrastructure leakage

\* deployment assumptions

\* runtime ownership assumptions

\* internal package coupling

\* unstable implementation details



\---



\# Example Public Usage



```ts

import {

&#x20; createPolicy,

&#x20; generateBundle,

&#x20; execute,

&#x20; verifyAttestation,

&#x20; canonicalize

} from "@pramanasystems/core";

```



\---



\# Architectural Principle



External consumers depend on governance semantics.



They must not depend on internal package structure.



\---



\# Long-Term Goal



pramanasystems becomes:



a portable deterministic governance standard layer



not merely a runtime framework







