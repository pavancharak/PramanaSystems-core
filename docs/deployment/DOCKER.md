# Docker Deployment Guide

PramanaSystems ships two Docker images: a **server** (Node.js governance runtime) and a **dashboard** (nginx-served React SPA). `docker compose` orchestrates them on a shared bridge network.

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2 (`docker compose`, not `docker-compose`)
- OpenSSL (for key generation)
- The monorepo root as the build context for both images

---

## Quick start

```bash
# 1. Clone the repository
git clone https://github.com/Pramana-Systems/PramanaSystems.git
cd PramanaSystems

# 2. Create your environment file
cp .env.example .env

# 3. Generate Ed25519 keys (see key generation section below)

# 4. Build and start
docker compose up --build -d

# 5. Verify
curl http://localhost:3000/health
# → {"status":"ok","version":"1.0.x", ...}
```

Dashboard: http://localhost:8080  
API: http://localhost:3000

---

## Generating Ed25519 keys for production

The server signs every `ExecutionAttestation` with an Ed25519 private key. For production deployments the key must be stable across restarts — an ephemeral in-memory key (the fallback when no key is configured) produces attestations that cannot be reverified after a restart.

```bash
# Generate private key (PKCS8 PEM)
openssl genpkey -algorithm ed25519 -out private.pem

# Derive public key (SPKI PEM)
openssl pkey -pubout -in private.pem -out public.pem

# Inspect the keys
openssl pkey -in private.pem -text -noout
openssl pkey -pubin -in public.pem -text -noout
```

Store the public key (`public.pem`) alongside your release artifacts as the verification trust root. Store the private key in a secret manager — never commit it to the repository.

---

## Configuration

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

### Required for production

| Variable | Description |
|---|---|
| `PRAMANA_PRIVATE_KEY` | PEM-encoded Ed25519 private key (PKCS8). Paste the full PEM block including headers. |
| `PRAMANA_PUBLIC_KEY` | PEM-encoded Ed25519 public key (SPKI). Must correspond to `PRAMANA_PRIVATE_KEY`. |
| `PRAMANA_API_KEY` | Bearer token required on all API requests. Generate with `openssl rand -hex 32`. |

### Optional

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | TCP port the server binds to inside the container. |
| `HOST` | `0.0.0.0` | Network interface the server binds to. |

### Setting multi-line PEM values in .env

```bash
# Wrap the PEM block in double quotes and preserve newlines:
PRAMANA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIExampleKeyMaterial...
-----END PRIVATE KEY-----"
```

Or export from files:

```bash
PRAMANA_PRIVATE_KEY="$(cat private.pem)"
PRAMANA_PUBLIC_KEY="$(cat public.pem)"
```

---

## Build

Both images are built from the monorepo root as the Docker build context. The build context uses the `.dockerignore` at the repo root to exclude `node_modules/`, `dist/`, `.git/`, and secrets.

```bash
# Build all images without starting containers
docker compose build

# Build a single image
docker compose build server
docker compose build dashboard
```

The server image uses a two-stage build:

1. **Builder** — installs all dependencies, compiles all workspace packages with `tsup` via Turbo.
2. **Runtime** — copies only `dist/` and `node_modules/` for the server and its workspace dependencies; runs as `USER node` (non-root, UID 1000).

The dashboard image:

1. **Builder** — installs all dependencies, builds `@pramanasystems/sdk-client` and then the dashboard Vite SPA.
2. **Runtime** — `nginx:alpine` serving the static `dist/` with the custom `nginx.conf`.

---

## Running

```bash
# Start in the background
docker compose up -d

# Follow logs
docker compose logs -f

# Follow logs for a single service
docker compose logs -f server
docker compose logs -f dashboard

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

The `dashboard` service waits for the `server` healthcheck to pass before starting (`depends_on: server: condition: service_healthy`).

---

## Health check

```bash
# Server health (direct)
curl http://localhost:3000/health

# Server health (via nginx proxy)
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "ok",
  "version": "1.0.5",
  "runtime_version": "1.0.0",
  "schema_version": "1.0.0"
}
```

The server service restarts automatically (`restart: unless-stopped`) and the Docker healthcheck polls `/health` every 30 seconds.

---

## Dashboard API proxy

The nginx configuration in the dashboard container proxies `/api/*` to the server:

```
http://localhost:8080/api/execute  →  http://server:3000/execute
http://localhost:8080/api/verify   →  http://server:3000/verify
http://localhost:8080/api/health   →  http://server:3000/health
```

In production, configure the dashboard's base URL (Settings panel → Base URL) to:

```
http://<your-host>:8080/api
```

This routes all SDK client calls through the nginx proxy without exposing the server port directly.

---

## Verifying an attestation after deployment

```bash
# Execute a governance decision
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PRAMANA_API_KEY" \
  -d '{
    "policy_id": "access-control",
    "policy_version": "v1",
    "decision_type": "approve",
    "signals_hash": "abc123..."
  }'

# Verify the returned attestation
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PRAMANA_API_KEY" \
  -d '<paste ExecutionAttestation JSON>'
```

---

## Production considerations

### Key management

For production deployments, store the private key in a hardware security module rather than an environment variable. `AwsKmsSigner` in `@pramanasystems/execution` supports AWS KMS — key material never leaves the HSM. Pass the KMS key ID via a custom environment variable and instantiate `AwsKmsSigner` in your deployment wrapper.

### Replay store

The default `MemoryReplayStore` is process-local — it resets on container restart. For distributed or HA deployments, configure `RedisReplayStore` with a shared Redis instance to prevent replay across replicas.

### TLS

The server and nginx both listen on plain HTTP. Terminate TLS at a reverse proxy (nginx, Caddy, cloud load balancer) in front of the containers, then proxy HTTP internally. Do not expose port 3000 directly in production — route all external traffic through port 8080 or your TLS terminator.

### Secrets

Never commit `.env` to the repository. The `.gitignore` already excludes it. In CI/CD inject secrets via the platform's secret manager (GitHub Actions secrets, AWS Secrets Manager, etc.).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Server returns 401 | `PRAMANA_API_KEY` set but not passed in request | Add `Authorization: Bearer <key>` header |
| Attestations unverifiable after restart | Ephemeral key used (no `PRAMANA_PRIVATE_KEY` set) | Set a stable key pair in `.env` |
| Dashboard shows "Dev Mode" | No `PRAMANA_API_KEY` in Settings panel | Enter the key in Settings → API Key |
| `/api/*` returns 502 | Server container not healthy yet | Wait for server healthcheck to pass; check `docker compose logs server` |
| Container exits immediately | Build output missing (failed tsup/vite build) | Run `docker compose build --no-cache` and inspect output |
