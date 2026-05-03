/**
 * 03 — Define Policy
 *
 * Demonstrates defining a governance policy in memory, scaffolding it to disk,
 * writing policy rules, generating a signed bundle, and cleaning up.
 *
 * The bundle signing key must be present at ./dev-keys/bundle_signing_key.
 *
 * Run from the repository root:
 *   npx tsx examples/03-define-policy/define-policy.ts
 */

import fs from "fs";
import path from "path";

import {
  definePolicy,
  createPolicy,
  generateBundle,
} from "@pramanasystems/governance";

// ── 1. Define a policy in memory ─────────────────────────────────────────────
// definePolicy is purely in-memory — no I/O.  Use it to validate your
// policy shape before writing anything to disk.
const definition = definePolicy({
  id:      "fraud-detection",
  version: "v1",
  rules: [
    {
      id:        "high-risk-block",
      condition: "risk_score > 80",
      action:    "deny",
    },
    {
      id:        "velocity-check",
      condition: "transactions_per_hour > 50",
      action:    "deny",
    },
    {
      id:        "default-approve",
      condition: "true",
      action:    "approve",
    },
  ],
});

console.log("=== PolicyDefinition (in memory) ===");
console.log("id     :", definition.id);
console.log("version:", definition.version);
console.log("rules  :", definition.rules.length, "rules");
definition.rules.forEach((r) =>
  console.log(`  [${r.id}] if ${r.condition} → ${r.action}`)
);

// ── 2. Scaffold the policy directory on disk ─────────────────────────────────
// createPolicy creates ./policies/fraud-detection/v1/ and writes a skeleton
// policy.json.  It throws if the directory already exists.
let versionDir: string;

try {
  versionDir = createPolicy(definition.id);
  console.log("\n=== createPolicy ===");
  console.log("created directory:", versionDir);
} catch (err) {
  // Policy already exists from a prior run — use the existing directory.
  versionDir = path.join("./policies", definition.id, "v1");
  console.log("\n=== createPolicy ===");
  console.log("policy already exists, using:", versionDir);
}

// ── 3. Write policy rules to policy.json ─────────────────────────────────────
// The skeleton written by createPolicy only contains the id + version header.
// Overwrite it with the full definition so generateBundle hashes all rules.
const policyJsonPath = path.join(versionDir, "policy.json");
fs.writeFileSync(
  policyJsonPath,
  JSON.stringify(
    {
      policy:  definition.id,
      version: definition.version,
      rules:   definition.rules,
    },
    null,
    2
  ),
  "utf8"
);
console.log("wrote policy.json :", policyJsonPath);

// ── 4. Generate a signed bundle ───────────────────────────────────────────────
// generateBundle hashes every artifact in the directory and writes
// bundle.manifest.json + bundle.sig.  Requires dev-keys/bundle_signing_key.
const bundle = generateBundle(definition.id, definition.version, versionDir);

console.log("\n=== generateBundle ===");
console.log("success       :", bundle.success);
console.log("manifest_path :", bundle.manifest_path);
console.log("signature_path:", bundle.signature_path);
console.log("bundle_hash   :", bundle.bundle_hash.slice(0, 16) + "…");

// ── 5. Clean up the temporary policy directory ────────────────────────────────
// Remove the policy we created so the example is idempotent.
fs.rmSync(path.join("./policies", definition.id), { recursive: true });
console.log("\n=== Cleanup ===");
console.log("removed ./policies/" + definition.id);
