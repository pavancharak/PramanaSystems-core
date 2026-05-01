import {
  defineConfig,
} from "vitest/config";

import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@pramanasystems/bundle":
        path.resolve(
          __dirname,
          "packages/bundle/src"
        ),

      "@pramanasystems/crypto":
        path.resolve(
          __dirname,
          "packages/crypto/src"
        ),

      "@pramanasystems/governance":
        path.resolve(
          __dirname,
          "packages/governance/src"
        ),

      "@pramanasystems/execution":
        path.resolve(
          __dirname,
          "packages/execution/src"
        ),

      "@pramanasystems/verifier":
        path.resolve(
          __dirname,
          "packages/verifier/src"
        ),

      "@pramanasystems/core":
        path.resolve(
          __dirname,
          "packages/core/src"
        ),
    },
  },

  test: {
    environment: "node",

    pool: "forks",

    fileParallelism: false,
  },
});


