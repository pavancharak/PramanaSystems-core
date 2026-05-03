# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests before source so npm ci is cached on code-only changes.
COPY package.json package-lock.json turbo.json ./

COPY packages/bundle/package.json       ./packages/bundle/
COPY packages/crypto/package.json       ./packages/crypto/
COPY packages/governance/package.json   ./packages/governance/
COPY packages/execution/package.json    ./packages/execution/
COPY packages/verifier/package.json     ./packages/verifier/
COPY packages/core/package.json         ./packages/core/
COPY packages/sdk-client/package.json   ./packages/sdk-client/
COPY packages/server/package.json       ./packages/server/

RUN npm ci

# Copy source for the server and every workspace package it depends on.
COPY packages/bundle/src                ./packages/bundle/src
COPY packages/bundle/tsup.config.ts    ./packages/bundle/tsup.config.ts
COPY packages/crypto/src                ./packages/crypto/src
COPY packages/crypto/tsup.config.ts    ./packages/crypto/tsup.config.ts
COPY packages/governance/src            ./packages/governance/src
COPY packages/governance/tsup.config.ts ./packages/governance/tsup.config.ts
COPY packages/execution/src             ./packages/execution/src
COPY packages/execution/tsup.config.ts  ./packages/execution/tsup.config.ts
COPY packages/verifier/src              ./packages/verifier/src
COPY packages/verifier/tsup.config.ts   ./packages/verifier/tsup.config.ts
COPY packages/core/src                  ./packages/core/src
COPY packages/core/tsup.config.ts       ./packages/core/tsup.config.ts
COPY packages/sdk-client/src            ./packages/sdk-client/src
COPY packages/sdk-client/tsup.config.ts ./packages/sdk-client/tsup.config.ts
COPY packages/server/src                ./packages/server/src
COPY packages/server/tsup.config.ts     ./packages/server/tsup.config.ts

# turbo respects "dependsOn": ["^build"] and builds workspace deps first.
RUN npx turbo run build --filter=@pramanasystems/server...

RUN npm prune --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Root manifest needed for npm workspace module resolution (symlinks in node_modules).
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Each workspace package needs its package.json (for the "exports" field) + built dist/.
COPY --from=builder /app/packages/bundle/package.json     ./packages/bundle/package.json
COPY --from=builder /app/packages/bundle/dist             ./packages/bundle/dist

COPY --from=builder /app/packages/crypto/package.json     ./packages/crypto/package.json
COPY --from=builder /app/packages/crypto/dist             ./packages/crypto/dist

COPY --from=builder /app/packages/governance/package.json ./packages/governance/package.json
COPY --from=builder /app/packages/governance/dist         ./packages/governance/dist

COPY --from=builder /app/packages/execution/package.json  ./packages/execution/package.json
COPY --from=builder /app/packages/execution/dist          ./packages/execution/dist

COPY --from=builder /app/packages/verifier/package.json   ./packages/verifier/package.json
COPY --from=builder /app/packages/verifier/dist           ./packages/verifier/dist

COPY --from=builder /app/packages/core/package.json       ./packages/core/package.json
COPY --from=builder /app/packages/core/dist               ./packages/core/dist

COPY --from=builder /app/packages/sdk-client/package.json ./packages/sdk-client/package.json
COPY --from=builder /app/packages/sdk-client/dist         ./packages/sdk-client/dist

COPY --from=builder /app/packages/server/package.json     ./packages/server/package.json
COPY --from=builder /app/packages/server/dist             ./packages/server/dist

EXPOSE 3000

# Run as the non-root node user shipped with the base image (UID 1000).
USER node

WORKDIR /app/packages/server
CMD ["node", "dist/index.js"]
