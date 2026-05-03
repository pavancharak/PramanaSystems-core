# 06 — HTTP Client

Use `PramanaClient` to call a live server: health check, execute a governance
decision, and verify the returned attestation over HTTP.

## What it demonstrates

1. Construct a `PramanaClient` with a base URL and optional API key
2. Call `GET /health` to confirm the server is reachable
3. Call `POST /execute` to run a governance decision remotely
4. Call `POST /verify` to verify the returned attestation
5. Handle `PramanaApiError` for non-2xx responses

## Run

```bash
# Start the server in a separate terminal first:
npm run start --workspace=packages/server

# Then run the example:
npx tsx examples/06-http-client/http-client.ts
```

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `PRAMANA_BASE_URL` | `http://localhost:3000` | Server base URL |
| `PRAMANA_API_KEY` | _(none)_ | Bearer token — only needed when server has `PRAMANA_API_KEY` set |

## Packages used

- `@pramanasystems/sdk-client` — `PramanaClient`, `PramanaApiError`
