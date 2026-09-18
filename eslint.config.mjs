import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not app code: source artwork, the Python asset pipeline, the design kit
    // and scratch output that predate the build.
    "assets/**",
    "tools/**",
    "output/**",
    "color_theme/**",
    // Vendored verbatim from react-bits so it can be re-pulled cleanly.
    // See src/vendor/reactbits/README.md.
    "src/vendor/**",
  ]),
]);

export default eslintConfig;
