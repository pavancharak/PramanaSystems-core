/**
 * 06 — HTTP Client
 *
 * Uses PramanaClient to call a live server: health check, execute a governance
 * decision, and verify the returned attestation.
 *
 * Run from the repository root (server must be running):
 *   npm run start --workspace=packages/server
 *   npx tsx examples/06-http-client/http-client.ts
 *
 * Environment variables:
 *   PRAMANA_BASE_URL — default: http://localhost:3000
 *   PRAMANA_API_KEY  — required when server has PRAMANA_API_KEY set
 */

import crypto from "crypto";

import {
  PramanaClient,
  PramanaApiError,
} from "@pramanasystems/sdk-client";

const BASE_URL = process.env["PRAMANA_BASE_URL"] ?? "http://localhost:3000";
const API_KEY  = process.env["PRAMANA_API_KEY"];

const client = new PramanaClient({ baseUrl: BASE_URL, apiKey: API_KEY });

// ── 1. Health check ───────────────────────────────────────────────────────────
console.log("=== GET /health ===");
console.log("base_url :", BASE_URL);

let healthOk = false;

try {
  const health = await client.health();
  console.log("status    :", health.status);
  console.log("version   :", health.version);
  console.log("timestamp :", health.timestamp);
  healthOk = true;
} catch (err) {
  if (
    err instanceof Error &&
    (err.message.includes("ECONNREFUSED") || err.message.includes("fetch"))
  ) {
    console.log("server not reachable — start it with: npm run start --workspace=packages/server");
    process.exit(0);
  }
  throw err;
}

if (!healthOk) process.exit(1);

// ── 2. Execute a governance decision ─────────────────────────────────────────
const signalsHash = crypto
  .createHash("sha256")
  .update(JSON.stringify({ insurance_active: true, risk_score: 20, vip_customer: true }))
  .digest("hex");

console.log("\n=== POST /execute ===");
console.log("policy_id     : claims-approval");
console.log("policy_version: v1");
console.log("decision_type : approve");
console.log("signals_hash  :", signalsHash.slice(0, 16) + "…");

let attestation;
try {
  attestation = await client.execute({
    policy_id:      "claims-approval",
    policy_version: "v1",
    decision_type:  "approve",
    signals_hash:   signalsHash,
  });
} catch (err) {
  if (err instanceof PramanaApiError) {
    console.error("API error", err.status, ":", err.message);
    process.exit(1);
  }
  throw err;
}

console.log("execution_id :", attestation.result.execution_id);
console.log("decision     :", attestation.result.decision);
console.log("executed_at  :", attestation.result.executed_at);
console.log("runtime_hash :", attestation.result.runtime_hash.slice(0, 16) + "…");
console.log("signature    :", attestation.signature.slice(0, 32) + "…");

// ── 3. Verify the attestation ─────────────────────────────────────────────────
console.log("\n=== POST /verify ===");

let verifyResult;
try {
  verifyResult = await client.verify(attestation);
} catch (err) {
  if (err instanceof PramanaApiError) {
    console.error("API error", err.status, ":", err.message);
    process.exit(1);
  }
  throw err;
}

console.log("valid              :", verifyResult.valid);
console.log("signature_verified :", verifyResult.checks.signature_verified);
console.log("runtime_verified   :", verifyResult.checks.runtime_verified);
console.log("schema_compatible  :", verifyResult.checks.schema_compatible);

// ── 4. Show error handling with an invalid request ────────────────────────────
console.log("\n=== Error handling (missing required field) ===");
try {
  await client.execute({
    policy_id:      "",
    policy_version: "v1",
    decision_type:  "approve",
    signals_hash:   signalsHash,
  });
} catch (err) {
  if (err instanceof PramanaApiError) {
    console.log("PramanaApiError caught:");
    console.log("  status :", err.status);
    console.log("  message:", err.message);
  } else {
    throw err;
  }
}
