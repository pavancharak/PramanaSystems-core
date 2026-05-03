/**
 * 02 — Local Signer
 *
 * Demonstrates generating an Ed25519 key pair and using LocalSigner /
 * LocalVerifier to sign and verify canonical payloads.  This is the
 * cryptographic foundation used throughout the execution pipeline.
 *
 * Run from the repository root:
 *   npx tsx examples/02-local-signer/local-signer.ts
 */

import crypto from "crypto";

import {
  LocalSigner,
  LocalVerifier,
} from "@pramanasystems/execution";

import {
  canonicalize,
} from "@pramanasystems/bundle";

// ── 1. Generate an Ed25519 key pair ──────────────────────────────────────
// Ed25519 produces 64-byte signatures. Keys are PKCS8 (private) and SPKI
// (public) PEM — the formats expected by LocalSigner and LocalVerifier.
const { privateKey: privatePem, publicKey: publicPem } =
  crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding:  { type: "spki",  format: "pem" },
  });

console.log("=== Generated key pair ===");
console.log(privatePem);
console.log(publicPem);

const signer   = new LocalSigner(privatePem);
const verifier = new LocalVerifier(publicPem);

// ── 2. Sign an arbitrary payload ─────────────────────────────────────────
// All PramanaSystems signing uses canonical JSON — object keys sorted
// recursively — so semantically identical payloads always hash identically.
const payload = {
  policy_id:      "claims-approval",
  decision_type:  "approve",
  signals_hash:   "abc123",
};

// Canonical form is what actually gets signed; key order in the original
// object does not matter.
const canonical = canonicalize(payload);
const signature = signer.sign(canonical);

console.log("=== Signing ===");
console.log("canonical payload  :", canonical);
console.log("base64 signature   :", signature);

// ── 3. Verify the signature ───────────────────────────────────────────────
const valid = verifier.verify(canonical, signature);
console.log("\n=== Verification ===");
console.log("valid (correct key):", valid); // true

// ── 4. Show tamper detection ──────────────────────────────────────────────
// Any modification to the signed payload causes verification to fail.
const tamperedCanonical = canonicalize({ ...payload, decision_type: "deny" });
const tamperedValid = verifier.verify(tamperedCanonical, signature);
console.log("valid (tampered)   :", tamperedValid); // false

// ── 5. Show key ordering invariance ──────────────────────────────────────
// Canonical JSON sorts keys, so different insertion orders produce the same
// bytes and the same signature.
const shuffled = {
  signals_hash:  payload.signals_hash,
  decision_type: payload.decision_type,
  policy_id:     payload.policy_id,
};
const shuffledCanonical = canonicalize(shuffled);
const shuffledValid = verifier.verify(shuffledCanonical, signature);
console.log("\n=== Key-ordering invariance ===");
console.log("original canonical :", canonical);
console.log("shuffled canonical :", shuffledCanonical);
console.log("identical          :", canonical === shuffledCanonical); // true
console.log("signature still valid:", shuffledValid); // true
