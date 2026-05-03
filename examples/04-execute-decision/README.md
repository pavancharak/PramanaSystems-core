# 04 — Execute Decision

Full `executeDecision` pipeline: issue a token, sign it, construct an `ExecutionContext`,
and execute the governance decision with replay protection.

## What it demonstrates

1. Issue an `ExecutionToken` with `issueExecutionToken`
2. Sign the token with `signExecutionToken`
3. Construct an `ExecutionContext` with strict `ExecutionRequirements`
4. Execute the governance decision with `executeDecision` + `MemoryReplayStore`
5. Show that re-submitting the same token ID is rejected as a replay attack

## Run

```bash
npx tsx examples/04-execute-decision/execute-decision.ts
```

## Prerequisites

Policy `claims-approval/v1` must exist at `./policies/claims-approval/v1/` with a valid
`bundle.manifest.json` and `bundle.sig`.  These are committed to the repository.

## Packages used

- `@pramanasystems/execution` — `issueExecutionToken`, `signExecutionToken`, `executeDecision`, `MemoryReplayStore`, `LocalSigner`, `LocalVerifier`, `getRuntimeManifest`
- `@pramanasystems/governance` — `RuntimeRequirements`, `ExecutionRequirements`
