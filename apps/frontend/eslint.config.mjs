import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig from "@rrd10-sas/config-eslint/next.js";

const eslintConfig = defineConfig([
  ...baseConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
