import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig from "../../packages/config-eslint/index.js";

const eslintConfig = defineConfig([
  ...baseConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
