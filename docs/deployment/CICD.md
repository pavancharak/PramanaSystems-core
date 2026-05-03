# CI/CD Guide

PramanaSystems uses three GitHub Actions workflows. This document covers secret setup, workflow behaviour, and how to trigger releases.

---

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Every push; PRs to `main` | Build + full check suite |
| `docker.yml` | Push to `main` | Build and push container images to GHCR |
| `release.yml` | Push of `v*` tags | Validate and publish packages to npm |

---

## Required secrets

### `NPM_TOKEN`

Required by `release.yml` to authenticate with the npm registry.

**Generate a token:**

1. Sign in to [npmjs.com](https://www.npmjs.com).
2. Open **Account → Access Tokens → Generate New Token**.
3. Select **Automation** (bypasses OTP — required for CI).
4. Copy the token immediately; it is not shown again.

**Add to the repository:**

1. Open the repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `NPM_TOKEN`
4. Value: paste the token.
5. Click **Add secret**.

The token needs publish access to the `@pramanasystems` npm scope. If the org scope is protected, ensure the token belongs to an account with publish rights.

### `GITHUB_TOKEN`

Automatically provided by GitHub Actions — no setup required. `docker.yml` uses it to authenticate with the GitHub Container Registry (GHCR). The workflow requests `permissions: packages: write` so the token can push images.

---

## Workflow details

### CI (`ci.yml`)

Runs on every push to any branch and on pull requests targeting `main`. Steps:

1. Checkout
2. Setup Node 20 with npm cache
3. `npm ci`
4. `npm run build` — Turbo builds all workspace packages in dependency order
5. `npm run check` — typecheck + boundary check + 92 tests + OpenAPI export

**Concurrency:** newer pushes to the same branch cancel in-progress runs, saving runner minutes.

This workflow supersedes the older `governance-ci.yml`. That file can be removed once the new workflow is confirmed working.

### Docker (`docker.yml`)

Runs only on pushes to `main`. Builds and pushes two container images to GHCR:

```
ghcr.io/<owner>/<repo>/server:latest
ghcr.io/<owner>/<repo>/server:<full-sha>
ghcr.io/<owner>/<repo>/dashboard:latest
ghcr.io/<owner>/<repo>/dashboard:<full-sha>
```

Images are public by default. To make them private, set package visibility in **GitHub → Packages → Package settings**.

GitHub Actions cache (`type=gha`) is used to speed up subsequent builds. Layer cache is shared between server and dashboard builds within the same workflow run.

**Pulling the latest image after a merge:**

```bash
docker pull ghcr.io/<owner>/<repo>/server:latest
docker pull ghcr.io/<owner>/<repo>/dashboard:latest
```

### Release (`release.yml`)

Triggered by pushing a tag matching `v*`. Steps:

1. Checkout
2. Setup Node 20 with npm cache, `registry-url: https://registry.npmjs.org`
   — writes `NODE_AUTH_TOKEN` into `.npmrc` for all subsequent `npm publish` calls
3. `npm ci`
4. `npm run release:validate`
   — runs: build → check → pack all packages → generate release manifest →
     generate rebuild attestation → verify reproducibility → consumer integration test
5. Publish each package in dependency order (bundle → crypto → governance →
   execution → verifier → core → verifier-cli → server → sdk-client)

`NODE_AUTH_TOKEN` is set on every publish step so npm can authenticate against the registry.

---

## Triggering a release

### 1. Bump the version

Update `version` in each publishable `packages/*/package.json` to the new version (e.g. `1.0.7`). Update `CHANGELOG.md`. Commit to `main`.

### 2. Push the tag

```bash
git tag v1.0.7
git push origin v1.0.7
```

This triggers `release.yml`. The tag must match `v*` exactly — annotated tags also work:

```bash
git tag -a v1.0.7 -m "Release v1.0.7"
git push origin v1.0.7
```

### 3. Monitor the run

Open **GitHub → Actions → Release** to follow progress. Each publish step shows the npm response. A failed publish step does **not** roll back prior publishes — if the run fails mid-way, manually publish the remaining packages with the same `NPM_TOKEN`.

### 4. Verify on npm

```bash
npm view @pramanasystems/core version
npm view @pramanasystems/server version
```

---

## Rotating secrets

### Rotate NPM_TOKEN

1. Generate a new **Automation** token on npmjs.com.
2. Update the `NPM_TOKEN` secret in GitHub repository settings.
3. Revoke the old token on npmjs.com.

### GITHUB_TOKEN rotation

Not required — GitHub rotates it automatically per workflow run.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Release fails with `401 Unauthorized` | `NPM_TOKEN` missing or expired | Regenerate and update the secret |
| Release fails with `403 Forbidden` | Token lacks publish rights for `@pramanasystems` scope | Use a token from an account with scope access |
| Release fails with `402 Payment Required` | Org scope requires paid plan for public publish | Ensure `--access public` flag is set (it is) |
| Docker push fails with `denied: permission_denied` | `packages: write` permission missing | Confirm the workflow has `permissions: packages: write` |
| Docker image name rejected (uppercase) | `github.repository` contains uppercase | The `Lowercase repository name` step handles this; check it ran |
| CI cancelled unexpectedly | Concurrency group cancelled by a newer push | Expected behaviour — only the latest push on a branch runs |
