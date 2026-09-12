import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    // Vendored third-party bundles: opencv.js (9.9MB wasm glue) is copied
    // verbatim from upstream, and *-player-script.js are ytdl debug dumps.
    // Linting them produced ~227k problems that buried the real source signal.
    "public/**",
    "*-player-script.js",
  ]),
]);

export default eslintConfig;
