# PramanaSystems Quickstart

## Install

```bash
npm install @pramanasystems/core
```

---

# External Runtime Verification Example

Create:

```text
verify.mjs
```

Paste:

```js
import {
  LocalSigner,
  verifyExecutionResult
} from "@pramanasystems/core";

const signer = new LocalSigner();

console.log("SIGNER CREATED:");
console.log(signer);

console.log("VERIFY FUNCTION EXISTS:");
console.log(typeof verifyExecutionResult);
```

---

# Run

```bash
node verify.mjs
```

---

# Expected Output

```text
SIGNER CREATED:
LocalSigner { privateKey: undefined }

VERIFY FUNCTION EXISTS:
function
```

---

# What This Validates

This validates:

- external npm package portability
- ESM runtime compatibility
- deterministic runtime SDK exports
- portable verifier access
- public SDK surface correctness

---

# Next Steps

Explore:

- replay-safe execution
- deterministic governance enforcement
- runtime provenance verification
- independent attestation verification
- portable governance workflows
