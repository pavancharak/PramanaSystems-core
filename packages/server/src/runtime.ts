import crypto from "crypto";

import {
  LocalSigner,
  LocalVerifier,
  getRuntimeManifest,
} from "@pramanasystems/execution";

import {
  loadPrivateKey,
  loadPublicKey,
} from "@pramanasystems/crypto";

export type SigningKeySource = "env" | "disk" | "ephemeral";

/**
 * Resolves the Ed25519 key pair for the server in priority order:
 * 1. `PRAMANA_PRIVATE_KEY` + `PRAMANA_PUBLIC_KEY` environment variables.
 * 2. Dev keys on disk at `./dev-keys/bundle_signing_key{,.pub}`.
 * 3. Ephemeral in-process key pair (new on every restart — dev only).
 */
function resolveKeyPair(): { privateKey: string; publicKey: string; source: SigningKeySource } {
  if (process.env.PRAMANA_PRIVATE_KEY && process.env.PRAMANA_PUBLIC_KEY) {
    return {
      privateKey: process.env.PRAMANA_PRIVATE_KEY,
      publicKey: process.env.PRAMANA_PUBLIC_KEY,
      source: "env",
    };
  }

  try {
    return {
      privateKey: loadPrivateKey(),
      publicKey: loadPublicKey(),
      source: "disk",
    };
  } catch {
    // no dev keys on disk — fall through to ephemeral
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });

  return { privateKey, publicKey, source: "ephemeral" };
}

const keys = resolveKeyPair();

export const signingKeySource: SigningKeySource = keys.source;
export const signer = new LocalSigner(keys.privateKey);
export const verifier = new LocalVerifier(keys.publicKey);
export const runtimeManifest = getRuntimeManifest();
