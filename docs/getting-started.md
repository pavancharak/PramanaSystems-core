\# Getting Started



\## Install



```bash

npm install @pramanasystems/core

```



\---



\## Verify External SDK Usage



Create:



```bash

verify.mjs

```



```js

import {

&#x20; LocalSigner,

&#x20; verifyExecutionResult

} from "@pramanasystems/core";



const signer = new LocalSigner();



console.log(signer);

console.log(typeof verifyExecutionResult);

```



Run:



```bash

node verify.mjs

```



Expected output:



```text

LocalSigner { privateKey: undefined }

function

```



\---



\## What This Validates



\- External npm portability

\- ESM runtime compatibility

\- Deterministic runtime SDK exports

\- Portable verification infrastructure



\---



\## Core Architecture



```text

AI → Signals → Deterministic Governance → Attested Decision

```



AI systems generate signals.



PramanaSystems enforces deterministic governance decisions.



\---



\## Next Steps



\- Replay-safe execution

\- Independent verification

\- Policy lifecycle tooling

\- Runtime provenance validation




