# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests before source so npm ci is cached on code-only changes.
COPY package.json package-lock.json turbo.json ./

COPY packages/sdk-client/package.json  ./packages/sdk-client/
COPY packages/dashboard/package.json   ./packages/dashboard/

RUN npm ci

# Copy source for sdk-client (dashboard's only workspace dependency) and dashboard.
COPY packages/sdk-client/src               ./packages/sdk-client/src
COPY packages/sdk-client/tsup.config.ts    ./packages/sdk-client/tsup.config.ts

COPY packages/dashboard/src                ./packages/dashboard/src
COPY packages/dashboard/index.html         ./packages/dashboard/index.html
COPY packages/dashboard/tsconfig.json      ./packages/dashboard/tsconfig.json
COPY packages/dashboard/tsconfig.node.json ./packages/dashboard/tsconfig.node.json
COPY packages/dashboard/vite.config.ts     ./packages/dashboard/vite.config.ts
COPY packages/dashboard/tailwind.config.js ./packages/dashboard/tailwind.config.js
COPY packages/dashboard/postcss.config.js  ./packages/dashboard/postcss.config.js

# Build sdk-client first (turbo respects "dependsOn": ["^build"]).
RUN npx turbo run build --filter=@pramanasystems/dashboard...

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Custom nginx config: gzip, security headers, /api/* proxy to server:3000.
COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite production build.
COPY --from=builder /app/packages/dashboard/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
