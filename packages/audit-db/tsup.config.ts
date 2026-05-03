import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  splitting: false,
  external: [
    "@pramanasystems/execution",
    "@pramanasystems/verifier",
    "pg",
  ],
});
